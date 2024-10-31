import useWebSocket, { ReadyState } from "react-use-websocket"
import { useEffect, useState } from 'react'
import { timeParse } from 'd3-time-format'
import useFetch from "./useFetch";
import BasicCandlestick from "./BasicCandlestick";
import { Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText, responsiveFontSizes, createTheme } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";


function reformat(stockHistory) {
    const parseDate = timeParse("%Y-%m-%d");
    const temp = stockHistory.map(d => {
        return {
            date: parseDate(d.date.split(' ')[0]),
            open: +d.open,
            close: +d.close,
            high: +d.high,
            low: +d.low,
            volume: +d.volume,
            dividend: '',
            absoluteChange: '',
            percentChange:'',
            split: ''
        }
    })
    return temp
}



const Home = () => {
  const stock_ws_endpoint = "ws://localhost:8080"

  const [selectedStock, setSelectedStock] = useState(-1)

  const [tickers, setTickers] = useState([]);
  const [stockData, setStockChartData] = useState([])
  const [stockSymbol, setStockSymbol] = useState('AAPL')
  const { 
    sendMessage, 
    lastMessage: wsMessage, 
    readyState: wsStatus 
  } = useWebSocket(stock_ws_endpoint)


  useEffect(() => {
    if(selectedStock === -1)
      return
    const ticker = tickers[selectedStock]
    console.log(`selected stock: ${ticker}`)
    console.log(`requesting from websocket...`)
    sendMessage(JSON.stringify({ type: 'subscribe',body: ticker }))
  }, [selectedStock])


  // Run when the connection state (readyState) changes
  useEffect(() => {
    console.log("...connection changed...")
    if (wsStatus === ReadyState.OPEN) {
        console.log('websocket connection open')    
    }
  }, [wsStatus])

  // Run when a new WebSocket message is received (lastJsonMessage)
  useEffect(() => {
    if(!wsMessage)
        return
    let response 
    response = JSON.parse(wsMessage.data)

    console.log(`websocket message received. type: ${response.type}`)
    if(response.type === 'stock-batch') {
        setStockChartData(reformat(response.data))
    } else if (response.type === 'stock-update') {
        if(stockData.length === 0) {
            return
        }
        const { date, high, low, open, close, volume } = response.data
        const temp = {
            date: new Date(date),
            high: high,
            low: low,
            open: open,
            close: close,
            volume: +volume
        }
        setStockChartData(stockData.concat([temp]))
    }
  }, [wsMessage])


  // TODO - add stock watchlist query + output
  // add and remove list maybe?... plus minus component from somewhere...


    // get stock symbols 
    const { status, data: stocksResponse } = useFetch('http://localhost:8080/stocks', selectedStock === -1 && stockData.length === 0)

    if(status ==='fetched' && !tickers.length) {
        setTickers(stocksResponse.rows.map(r => r.ticker))
    }


    const removeFromWatchlist = async (symbolToRemove) => {
        console.log('sending req to DELETE ', symbolToRemove)
        
        await fetch(`http://localhost:8080/stocks/${symbolToRemove}`, { method: 'DELETE'})
        setTickers(tickers.filter(t => t !== symbolToRemove))
        setSelectedStock(-1)
        setStockChartData([])
        
        sendMessage(JSON.stringify({ type:'unsubscribe', symbolToRemove }))
        return
    }

    const addToWatchlist = async (symbolToAdd) => {
        console.log('sending req to POST ', symbolToAdd)
        await fetch(`http://localhost:8080/stocks/${symbolToAdd}`, { method: 'POST' })
        setTickers(tickers.concat([symbolToAdd]))
        return
    }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height:'100%', justifyContent:'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column'}}>
        </div>


<div style={{ display:'flex', flexDirection:'row'}}>
    
    <Paper style={{width:175 }} variant='outlined' elevation={0}>

        {
        selectedStock === -1 ?
        <>WATCHING NO STOCKS</> 
        :   
        <>WATCHING {tickers[selectedStock]}</>
        }

        <List>
        { status === 'fetched' ? 
                tickers.map((stockSymbol, i) => 
                <ListItem key={i} disablePadding>
                    <ListItemButton onClick={(e) => {
                        const stockClicked = e.currentTarget.textContent
                        setSelectedStock(tickers.indexOf(stockClicked))
                    }}>
                        <ListItemText primary={stockSymbol} />
                    </ListItemButton>
                </ListItem>
                )
            :
            <></>
        }
        </List>
        <button onClick={(e) => {
            removeFromWatchlist(tickers[selectedStock])
        }}>remove selected stock</button>
        <div>
                <button onClick={(e) => {
                    addToWatchlist(stockSymbol)
                }}>
                    Add stock symbol
                </button>
                <input value={stockSymbol} onChange={(e) => {setStockSymbol(e.target.value)}}></input>
            </div>
        </Paper>

        <BasicCandlestick
            data={stockData}
            width={800}
            ratio={1}
            height={500}
        />
</div>
    </div>
  )
}

export default Home;