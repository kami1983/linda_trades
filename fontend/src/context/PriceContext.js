import React, { createContext, useContext, useEffect, useState } from 'react';

const PriceContext = createContext();

export const PriceProvider = ({ children }) => {
    const defaultPriceData = [
        { status: false, data: { symbol: 'eth', price: 0 } },
        { status: false, data: { symbol: 'btc', price: 0 } }
    ];
    const [coinPrices, setCoinPrices] = useState(defaultPriceData);
    const apiHosts = process.env.REACT_APP_API_HOSTS;

    const callFetchPrice = (symbol) => {
        return new Promise((resolve, reject) => {
            fetch(`${apiHosts}/api/current_price?symbol=${symbol}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data) {
                        resolve(data);
                    } else {
                        reject('error');
                    }
                });
        });
    };

    useEffect(() => {
        const fetchPrices = () => {
            const symbols = ['eth', 'btc'];
            const promises = symbols.map(callFetchPrice);
            try{
                Promise.all(promises).then(setCoinPrices).catch(() => {
                    setCoinPrices(defaultPriceData);
                });
            }catch(err){
                console.log('error: ', err);
            }
        };

        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <PriceContext.Provider value={coinPrices}>
            {children}
        </PriceContext.Provider>
    );
};

export const usePrices = () => {
    return useContext(PriceContext);
};
