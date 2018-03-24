const express    = require('express');
const https      = require('https');
const bodyParser = require('body-parser');
const mysql      = require('mysql');
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

    let currencyUpd = setInterval(getCurrencyData, 50);
});
app.get('/api/currency', (req, res) => {
    res.json(currencyData);
});
app.post('/api/tokens', (req,res) => {
    connection.connect(function(err) {
        if(err) throw err;

        let sql = 'INSERT INTO tokens SET ?';
        connection.query(sql, req.body, function (err, rows, fields) {
            if(err) throw err;
        });
    });

    res.status(200).json({});
});
app.post('/api/notification', (req, res) => {
    connection.connect(function(err) {
        if(err) throw err;

        let sql = 'INSERT INTO notify SET ?';
        connection.query(sql, req.body, function (err, rows, fields) {
            if(err) throw err;
        });
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
            currencyData = currencyArray;
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    });
}