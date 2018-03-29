# crypto-api

`npm start`

### Методы

**Уведомление о повышении цены
post-запрос /api/notify/max**
 - registration_id
 - currency
 - price

**Уведомление о понижении цены
post-запрос /api/notify/min**
- registration_id
- currency
- price

**Отмена уведомления о повышении цены
post-запрос /api/notify/max/del**
- registration_id
- currency

**Отмена уведомления о понижении цены
post-запрос /api/notify/min/del**
- registration_id
- currency

**Отправка сообщения всем пользователям из базы
get-запрос /api/notify/send**
- title
- body
