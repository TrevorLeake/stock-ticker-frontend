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

//   const { status: b,  } = useFetch('http://localhost:8080/stocks')
// watched stocks...

  const [tickers, setTickers] = useState([]);
  const [stockData, setStockChartData] = useState([])
  const [stockSymbol, setStockSymbol] = useState('AAPL')
  const { 
    sendMessage, 
    lastMessage: wsMessage, 
    readyState: wsStatus 
  } = useWebSocket(stock_ws_endpoint, { 
    // shouldReconnect: () => true,
  })



  // Run when the connection state (readyState) changes
  useEffect(() => {
    console.log("Connection state changed")
    if (wsStatus === ReadyState.OPEN) {
        console.log('ws open')
        sendMessage(
            JSON.stringify({ body: stockSymbol, type: 'stock-history' })
        )
    }
  }, [wsStatus])

  // Run when a new WebSocket message is received (lastJsonMessage)
  useEffect(() => {
    if(!wsMessage)
        return
    console.log(wsMessage.data) 
    let response 
    try{
        response = JSON.parse(wsMessage.data)
        console.log('ok')
        if(response.type === 'cors') {
            console.error('CORS error')
        }
    } catch {
        console.log('AAAAAHH', wsMessage)
    }

    console.log('ws msg:', response)

    if(response.type === 'stock-history') {
        setStockChartData(reformat(response.data))
        sendMessage(JSON.stringify({ type: 'live-update' }))
    } else if (response.type === 'live-update') {
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


    // a mini bank of prewritten stock symbols for use... mayb frmo a query..
    const { status, data: stocksResponse } = useFetch('http://localhost:8080/stocks')
    if(status ==='fetched' && !tickers.length) {
        setTickers(stocksResponse.rows.map(r => r.ticker))
    }


    const removeFromWatchlist = async (symbolToRemove) => {
        console.log('sending req to DELETE ', symbolToRemove)
        
        await fetch(`http://localhost:8080/stocks/${symbolToRemove}`, { method: 'DELETE'})
        setTickers(tickers.filter(t => t !== symbolToRemove))
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
            <div>
                <button onClick={(e) => {
                    addToWatchlist(stockSymbol)
                }}>
                    Add stock symbol
                </button>
                <input value={stockSymbol} onChange={(e) => {setStockSymbol(e.target.value)}}></input>
            </div>

<div style={{ display:'flex', flexDirection:'row'}}>
    
    <Paper style={{width:175 }} variant='outlined' elevation={0}>
        <List>
        { status === 'fetched' ? 
                tickers.map((stockSymbol, i) => 
                <ListItem key={i} disablePadding>
                    <ListItemButton onClick={(e) => {
                        const symbolToRemove = e.currentTarget.textContent
                        removeFromWatchlist(symbolToRemove)
                    }}>
                        <ListItemText primary={stockSymbol} />
                    </ListItemButton>
                </ListItem>
                )
            :
            <></>
        }
        </List>
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