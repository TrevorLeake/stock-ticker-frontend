import { useState, useEffect} from 'react'


const useFetch = (url, deps) => {
    const [status, setStatus] = useState('idle');
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!url || url === '') return;
        const fetchData = async () => {
            setStatus('fetching');

            const response = await fetch(url);
            let data
            try {
                data = await response.json();
            } catch {
                console.log(response)
            }
            setData(data);
            setStatus('fetched');
        };

        fetchData();
    }, [deps]);

    return { status, data };
};

export default useFetch
