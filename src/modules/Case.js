import { useParams } from "react-router-dom";

export const Case = () => {
    const { id } = useParams();

    return (
        <div className='page-container case-page'>
            <div id='page-header'>
                <h1>Case {id}</h1>
            </div>
            <div className='case-sections'>

            </div>
        </div>
    );
};

export default Case;
