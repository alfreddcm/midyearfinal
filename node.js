const express = require('express');
const mysql = require('mysql');
const http = require('http');
const socketIO = require('socket.io');
const SerialPort = require('serialport');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const path = require('path');

app.use(express.json());

const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'RFIDScans'
});

db.connect(function (err) {
  if (err) throw err;
  console.log('SQL connected');
});


//frameset routes eme

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dash', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, 'history.html'));
});
app.get('/top', (req, res) => {
  res.sendFile(path.join(__dirname, 'top.html'));
});

app.get('/option', (req, res) => {
  res.sendFile(path.join(__dirname, 'option.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/foot', (req, res) => {
  res.sendFile(path.join(__dirname, 'foot.html'));
});

app.get('/kuu', (req, res) => {
  res.sendFile(path.join(__dirname, 'kuu.jpg'));
});
app.get('/ped', (req, res) => {
  res.sendFile(path.join(__dirname, 'ped.jpg'));
});


//sockeit conn
io.on('connection', socket => {
  console.log('Client connected');
  const portName = '/dev/cu.wchusbserial1410';
  const serialPort = new SerialPort(portName, { baudRate: 9600 });


  serialPort.on('data', data => {
    const rawData = data.toString();
    console.log('Received data:', rawData);

    const now = new Date();
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };

    const formattedDateTime = now.toLocaleDateString('en-US', options).replace(',', '');
    const dataArray = rawData.split(':');
    const card = dataArray[0];
    const acc = dataArray[1];
    const id = dataArray[2];
    const temperature = dataArray[3];

    const parsedData = {
      card: card,
      acc: acc,
      id: id,
      temperature: temperature
    };
    socket.emit('updateData', parsedData);

    const sql = "INSERT INTO data (access, uid, temp, datetime) VALUES ('" + acc + "', '" + id + "',' " + temperature + " C','" + formattedDateTime + "')";

    db.query(sql, function (err, result) {
      if (err) {
        console.log('Failed to insert data', err);
      } else {
        console.log('Data Inserted: ', result.affectedRows);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    serialPort.close();
  });
});

//view
app.get('/getdata', (req, res) => {
  const sql = "SELECT * FROM data";

  db.query(sql, (err, result) => {
    if (err) {
      console.log('Failed to get the data:', err);
      res.status(500).send('Failed to get data.');
    } else {
      console.log('Retrieved data:', result);
    }
    res.json(result);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


