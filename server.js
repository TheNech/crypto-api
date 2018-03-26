const express    = require('express');
const https      = require('https');
const bodyParser = require('body-parser');
const mysql      = require('mysql');
const fetch      = require('node-fetch');
const admin      = require('firebase-admin');
const logger     = require('./logger');
const app        = express();
const port       = (process.env.PORT || '8000');
app.use(bodyParser.urlencoded({ extended: true }));

//firebase
let serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-e8d1b.firebaseio.com"
});
//--------

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
    logger.info('Server started on ' + port)

    let currencyUpd = setInterval(getCurrencyData, 100);
    // connection.connect(function(err) {
    //     if(err) throw err;
    // });   
    
});
app.get('/api/currency', (req, res) => {
    res.json(currencyData);
});
app.post('/api/tokens', (req,res) => {
    let sqlSel = 'SELECT * FROM tokens WHERE ?'
    connection.query(sqlSel, req.body, function (err, rows, fields) {
        if (err) throw err;
        if(rows.length == 0) {
            let sql = 'INSERT INTO tokens SET ?';
            connection.query(sql, req.body, function (err, rows, fields) {
                if(err) throw err;
                res.status(200).json({});
            });
        } else res.status(200).json({});
    });

});
app.post('/api/notification', (req, res) => {
    let sql = 'INSERT INTO notify SET ?';
    connection.query(sql, req.body, function (err, rows, fields) {
        if(err) throw err;
    });

    res.status(200).json({});
});
app.get('/api/notification/send', (req, res) => {
    logger.info(req.query);
    var payload = {
      notification: {
        title: req.query.title,
        body: req.query.body
      }
    };

    getTokens.then(tokens => {
        logger.debug(tokens);
        admin.messaging().sendToDevice(tokens, payload)
          .then(function(response) {
            logger.debug('Successfully sent message:', response);
          })
          .catch(function(error) {
            logger.warn('Error sending message:', error);
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

    getNotifyList.then(arr => {
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

let getNotifyList = new Promise(function(resolve, reject) {
    let sql = 'SELECT * FROM notify';
    let notifyList = [];
    connection.query(sql,  function (err, rows, fields) {
        if(err) throw err;
        else {
            notifyList = rows.concat([]);
            resolve(notifyList);
        }
    });
});

let getTokens = new Promise(function(resolve, reject) {
    let sql = 'SELECT registration_id FROM tokens';

    connection.query(sql, function(err, rows, fields) {
        if (err) throw err;
        else {
            let tokens = [];
            rows.forEach(function(item, i, rows) {
                tokens.push(item.registration_id.toString());
            });
            resolve(tokens);
        }
    });
});