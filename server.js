const express    = require('express');
const https      = require('https');
const bodyParser = require('body-parser');
const mysql      = require('mysql');
const fetch      = require('node-fetch');
const app        = express();
const port       = (process.env.PORT || '8000');
app.use(bodyParser.urlencoded({ extended: true }));

let currencyData = '';

//mysql
const connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'crypto'
});
//-----

app.listen(port, () => {
    console.log('Server started on ' + port)

    let currencyUpd = setInterval(getCurrencyData, 100);
    // connection.connect(function(err) {
    //     if(err) throw err;
    // });    

    setTimeout(function() {
        sendNotify();
    }, 150);
    
});
app.get('/api/currency', (req, res) => {
    res.json(currencyData);
});
app.post('/api/tokens', (req,res) => {
    let sql = 'INSERT INTO tokens SET ?';
    connection.query(sql, req.body, function (err, rows, fields) {
        if(err) throw err;
    });

    res.status(200).json({});
});
app.post('/api/notification', (req, res) => {
    let sql = 'INSERT INTO notify SET ?';
    connection.query(sql, req.body, function (err, rows, fields) {
        if(err) throw err;
    });

    res.status(200).json({});
});
app.post('/api/notification/max', (req, res) => {
    let sql = 'INSERT INTO notify_max SET ?';
    connection.query(sql, req.body, function (err, rows, fields) {
        if(err) throw err;
    });

    res.status(200).json({});
});

function getCurrencyData() {
    const fsyms = 'BTC,ETH,LTC,XRP,BCH,TRX,BNB,ETC,EOS,XEM,NEO,DASH,HT,NCASH,XMR,VEN,ICX,ADA,XRB,IOT,ZEC,XLM,IOST,ABT,WAVES,OMG,ELF,LSK,QTUM,ELA,POWR,MTL,MCO,NBT,EMC2,GVT,HSR,BTG,MTN*,BTM*,AST,DGD,TNT,ADX,THETA,GNT,OCN,ZIL,SUB,SRN';

    https.get('https://min-api.cryptocompare.com/data/pricemultifull?fsyms=' + fsyms + '&tsyms=USD', (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            data = JSON.parse(data).RAW;
            let currencyArray = [];

            for (let key in data) {
                let tempCur = {};
                tempCur.name = key;
                tempCur.price = data[key].USD.PRICE.toString();
                tempCur.pct_change_24h = data[key].USD.CHANGEPCT24HOUR.toString();

                currencyArray.push(tempCur);
            }
            currencyData = currencyArray.concat([]);
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    });
}

function sendNotify() {
    const fsyms = 'BTC,ETH,LTC,XRP,BCH,TRX,BNB,ETC,EOS,XEM,NEO,DASH,HT,NCASH,XMR,VEN,ICX,ADA,XRB,IOT,ZEC,XLM,IOST,ABT,WAVES,OMG,ELF,LSK,QTUM,ELA,POWR,MTL,MCO,NBT,EMC2,GVT,HSR,BTG,MTN*,BTM*,AST,DGD,TNT,ADX,THETA,GNT,OCN,ZIL,SUB,SRN';
    let url = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms='+ fsyms + '&tsyms=USD';
    let delArray = [];

    getNotifyMaxList.then(arr => {
        fetch(url)
            .then(res => res.json())
            .then(json => {
                if(json[arr[0].currency].USD > arr[0].price){
                    delArray.push(arr[0].id);
                }
            })
            .catch(err => console.log(err));
    });
    console.log(delArray);
}

let getNotifyMaxList = new Promise(function(resolve, reject) {
    let sql = 'SELECT * FROM notify_max';
    let notifyList = [];
    connection.query(sql,  function (err, rows, fields) {
        if(err) throw err;
        else {
            notifyList = rows.concat([]);
            resolve(notifyList);
        }
    });
});
