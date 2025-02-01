import React, { useEffect, useRef, useState } from "react";

const LineGraph = ({ data, title, secondData = null, yAxisLabel = "count" }) => {
    const canvasRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 300, height: 250 });
    const [canvasWidth, setCanvasWidth] = useState(window.innerWidth < 600 ? 300 : 700);
    const [aggregatedData, setAggregatedData] = useState({});
    const [aggregatedSecondData, setAggregatedSecondData] = useState({});

    useEffect(() => {
        const handleResize = () => {
            setCanvasWidth(window.innerWidth < 600 ? 300 : 600);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!data || typeof data !== "object" || Object.keys(data).length === 0) return;

        const yearlyTotals = {};
        const yearlySecondTotals = {};

        Object.keys(data).forEach(date => {
            const year = date.slice(0, 4);

            if (!yearlyTotals[year]) yearlyTotals[year] = 0;
            if (secondData && !yearlySecondTotals[year]) yearlySecondTotals[year] = 0;

            yearlyTotals[year] += parseFloat(secondData ? data[date][0] : data[date]) || 0;
            if (secondData) yearlySecondTotals[year] += parseFloat(secondData[date] || data[date][1]) || 0;
        });

        const sortedYears = Object.keys(yearlyTotals).sort();
        const isMobile = window.innerWidth < 600;

        const displayCount = isMobile ? 3 : Math.min(15, sortedYears.length);
        const selectedYears = sortedYears.slice(-displayCount);

        const filteredMain = {};
        const filteredSecondary = {};

        selectedYears.forEach(year => {
            filteredMain[year] = yearlyTotals[year];
            if (secondData) filteredSecondary[year] = yearlySecondTotals[year] || 0;
        });

        setAggregatedData(filteredMain);
        setAggregatedSecondData(secondData ? filteredSecondary : {});
    }, [data, secondData, canvasWidth]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!aggregatedData || typeof aggregatedData !== "object" || Object.keys(aggregatedData).length === 0) return;

        const years = Object.keys(aggregatedData).sort();
        const values = years.map(year => aggregatedData[year] || 0);
        const secondValues = Object.keys(aggregatedSecondData).length > 0
            ? years.map(year => aggregatedSecondData[year] || 0)
            : Array(years.length).fill(0);

        const allValues = [...values, ...secondValues];
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const range = maxValue - minValue || 1;

        const width = canvasWidth;
        const height = 250;
        const paddingX = 40;
        const paddingY = 40;
        const chartWidth = width - paddingX * 2;
        const chartHeight = height - paddingY * 2;

        const scaleX = index => paddingX + (index / Math.max(1, years.length - 1)) * chartWidth;
        const scaleY = value => paddingY + chartHeight - ((value - minValue) / range) * chartHeight;

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        const createGradient = (ctx, color1, color2) => {
            const gradient = ctx.createLinearGradient(0, paddingY, 0, height - paddingY);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            return gradient;
        };

        const purpleGradient = createGradient(ctx, "rgba(98, 75, 143, 0.3)", "rgba(225, 215, 245, 0)");
        const orangeGradient = createGradient(ctx, "rgba(255, 166, 77, 0.3)", "rgba(255, 234, 214, 0)");

        ctx.beginPath();
        ctx.moveTo(scaleX(0), scaleY(values[0]));
        for (let i = 1; i < years.length; i++) {
            ctx.lineTo(scaleX(i), scaleY(values[i]));
        }
        ctx.lineTo(scaleX(years.length - 1), height - paddingY);
        ctx.lineTo(scaleX(0), height - paddingY);
        ctx.closePath();
        ctx.fillStyle = purpleGradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(scaleX(0), scaleY(values[0]));
        for (let i = 1; i < years.length; i++) {
            ctx.lineTo(scaleX(i), scaleY(values[i]));
        }
        ctx.strokeStyle = "rgb(77, 68, 109)";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (secondValues.some(v => v > 0)) {
            ctx.beginPath();
            ctx.moveTo(scaleX(0), scaleY(secondValues[0]));
            for (let i = 1; i < years.length; i++) {
                ctx.lineTo(scaleX(i), scaleY(secondValues[i]));
            }
            ctx.strokeStyle = "rgb(255, 166, 77)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.font = "14px Inter, sans-serif";
        ctx.fillStyle = "#B0B0B0";
        ctx.textAlign = "center";

        years.forEach((year, i) => {
            ctx.fillText(year, scaleX(i), height - 10);
        });

        ctx.textAlign = "right";
        ctx.fillStyle = "#B0B0B0";
        const yAxisValues = [minValue, minValue + range * 0.33, minValue + range * 0.66, maxValue];

        yAxisValues.forEach(value => {
            const y = scaleY(value);
            ctx.fillText(yAxisLabel == "count" ? value.toFixed(0) : `$${(value / 1_000_000).toFixed(0)}M`, paddingX -2, y);
        });

    }, [aggregatedData, aggregatedSecondData, canvasWidth]);

    return (
        <div className="graph-container">
            <div className='grid-lines canvas'>
                {[0,1,2,3].map((_, index) => (
                    <div key={`${index}-grid-line`} className="y-grid-line"></div>
                ))}
            </div>
            <canvas ref={canvasRef} style={{height: "100%", width: "100%"}} className="graph-canvas"></canvas>
        </div>
    );
};

export default LineGraph;