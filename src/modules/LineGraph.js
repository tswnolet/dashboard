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
    
        const dateKeys = Object.keys(data).sort();
        if (dateKeys.length === 0) return;
    
        const firstDate = new Date(dateKeys[0]);
        const lastDate = new Date(dateKeys[dateKeys.length - 1]);
        const dateDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    
        let groupByFormat = "YYYY";
    
        if (dateDiff <= 7) {
            groupByFormat = "YYYY-MM-DD";
        } else if (dateDiff <= 30) {
            groupByFormat = "YYYY-MM-W";
        } else if (dateDiff <= 365) {
            groupByFormat = "YYYY-MM";
        }
    
        const formattedTotals = {};
        const formattedSecondTotals = {};
    
        dateKeys.forEach(date => {
            const formattedDate = date.slice(0, groupByFormat.length);
    
            if (!formattedTotals[formattedDate]) formattedTotals[formattedDate] = 0;
            if (secondData && !formattedSecondTotals[formattedDate]) formattedSecondTotals[formattedDate] = 0;
    
            formattedTotals[formattedDate] += parseFloat(secondData ? data[date][0] : data[date]) || 0;
            if (secondData) {
                formattedSecondTotals[formattedDate] += parseFloat(secondData[date] || data[date][1]) || 0;
            }
        });
    
        setAggregatedData(formattedTotals);
        setAggregatedSecondData(secondData ? formattedSecondTotals : {});
    }, [data, secondData, canvasWidth]);    

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const textColor = getComputedStyle(document.documentElement).getPropertyValue("--text-color").trim();
        const lineColor = getComputedStyle(document.documentElement).getPropertyValue("--border-color").trim();

    
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
    
        ctx.strokeStyle = lineColor || "#ddd";
        ctx.lineWidth = 1;
    
        const yAxisValues = [minValue, minValue + range * 0.33, minValue + range * 0.66, maxValue];
    
        yAxisValues.forEach(value => {
            const y = scaleY(value);
            
            ctx.beginPath();
            ctx.moveTo(paddingX, y);
            ctx.lineTo(width - paddingX, y);
            ctx.stroke();
        });
    
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
    
        ctx.font = "12px Inter, sans-serif";
        ctx.fillStyle = textColor || "#FFFFFF";
        ctx.textAlign = "center";
    
        years.forEach((year, i) => {
            if ((i + 1) % 2 === 0) {
                ctx.fillText(year, scaleX(i), height - 10);
            }
        });        
    
        ctx.textAlign = "right";
        ctx.fillStyle = textColor || "#FFFFFF";

        yAxisValues.forEach(value => {
            const y = scaleY(value);
            ctx.fillText(yAxisLabel === "count" ? value.toFixed(0) : `$${(value / 1_000_000).toFixed(0)}M`, paddingX -2, y + 5);
        });
    
    }, [aggregatedData, aggregatedSecondData, canvasWidth]);    

    return (
        <div className="graph-container">
            <canvas ref={canvasRef} style={{height: "100%", width: "100%"}} className="graph-canvas"></canvas>
        </div>
    );
};

export default LineGraph;