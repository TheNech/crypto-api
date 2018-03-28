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
    let priceNotify = setInterval(chekNotify, 5000);
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

app.post('/api/notify/max', (req, res) => {
    let sql = 'INSERT INTO notify_max SET ?';
    connection.query(sql, req.body, function (err, rows, fields) {
        if(err) throw err;
    });

    res.status(200).json({});
});

app.post('/api/notify/min', (req, res) => {
    let sql = 'INSERT INTO notify_min SET ?';
    connection.query(sql, req.body, function (err, rows, fields) {
        if(err) throw err;
    });

    res.status(200).json({});
});

app.post('/api/notify/max/del', (req, res) => {
    let sql = 'DELETE FROM notify_ma xWHERE registration_id = ? AND currency = ?';
    let arr = [];
    arr.push(req.body.registration_id.toString());
    arr.push(req.body.currency.toString());

    connection.query(sql, arr, function (err, rows, fields) {
        if(err) throw err;
    });

    res.status(200).json({});
});

app.post('/api/notify/min/del', (req, res) => {
    let sql = 'DELETE FROM notify_min WHERE registration_id = ? AND currency = ?';
    let arr = [];
    arr.push(req.body.registration_id.toString());
    arr.push(req.body.currency.toString());

    connection.query(sql, arr, function (err, rows, fields) {
        if(err) throw err;
    });

    res.status(200).json({});
});

app.get('/api/notification/send', (req, res) => {
    let payload = {
      notification: {
        title: req.query.title,
        body: req.query.body
      }
    };

    getTokens.then(tokens => {
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

function chekNotify() {
    const fsyms = 'BTC,ETH,LTC,XRP,BCH,TRX,BNB,ETC,EOS,XEM,NEO,DASH,HT,NCASH,XMR,VEN,ICX,ADA,XRB,IOT,ZEC,XLM,IOST,ABT,WAVES,OMG,ELF,LSK,QTUM,ELA,POWR,MTL,MCO,NBT,EMC2,GVT,HSR,BTG,MTN*,BTM*,AST,DGD,TNT,ADX,THETA,GNT,OCN,ZIL,SUB,SRN';
    let url = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms='+ fsyms + '&tsyms=USD';

    fetch(url)
        .then(res => res.json())
        .then(json => {
            
            let getMaxNotifyList = new Promise(funcMax);
            getMaxNotifyList.then(arr => {
                arr.forEach(function(item, i, arr){
                    if(json[item.currency].USD > item.price) {
                        sendPriceNotify('max', item.registration_id, item.currency, json[item.currency].USD);
                        delFromTable('notify_max', item.id);
                    }
                });
            });

            let getMinNotifyList = new Promise(funcMin);
            getMinNotifyList.then(arr => {
                arr.forEach(function(item, i, arr){
                    if(json[item.currency].USD < item.price) {
                        sendPriceNotify('min', item.registration_id, item.currency, json[item.currency].USD);
                        delFromTable('notify_min', item.id);
                    }
                });
            });
        })
        .catch(err => console.log(err));

    let funcMax = function(resolve, reject) {
        let sql = 'SELECT * FROM notify_max';
        let notifyList = [];
        connection.query(sql,  function (err, rows, fields) {
            if(err) throw err;
            else {
                notifyList = rows.concat([]);
                resolve(notifyList);
            }
        });
    };

    let funcMin = function(resolve, reject) {
        let sql = 'SELECT * FROM notify_min';
        let notifyList = [];
        connection.query(sql,  function (err, rows, fields) {
            if(err) throw err;
            else {
                notifyList = rows.concat([]);
                resolve(notifyList);
            }
        });
    };
}

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

function sendPriceNotify(flag, token, currency, price) {
    let payload = {};
    if(flag == 'max') {
        payload = {
          notification: {
            title: currency,
            body: "Цена повысилась и составляет $" + price
          }
        };
    }
    if(flag == 'min') {
        payload = {
          notification: {
            title: currency,
            body: "Цена понизилась и составляет $" + price
          }
        };
    }
    
    admin.messaging().sendToDevice(token, payload)
      .then(function(response) {
        logger.debug('Successfully sent message:', response);
      })
      .catch(function(error) {
        logger.warn('Error sending message:', error);
      });
}

function delFromTable(table, id) {
    let sql = "DELETE FROM " + table + " WHERE id=" + id;

    connection.query(sql, function(err, rows, fields) {
        if(err) throw err;
    });
}