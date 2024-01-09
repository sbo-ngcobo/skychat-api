const express = require('express');

const cors = require('cors');
const mongoose = require('mongoose');
const Pusher = require("pusher");
const User = require('./models/user')
const bodyParser = require('body-parser')
const Channel = require('./models/channel')
const Message = require('./models/message');


const pusher = new Pusher({
  appId: "1712847",
  key: "2379d96c8a5e172c8ea9",
  secret: "0bdb4edf6d4537dac4da",
  cluster: "sa1",
  useTLS: true
});

const app = express();

const uri = 'mongodb+srv://phumlanijack:Diphu922ovicom@cluster0.jfie6vv.mongodb.net/?retryWrites=true&w=majority'

const port = 8000;

// Enable CORS for specified origins
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4200']
}));

app.use(bodyParser.urlencoded({
  extended: true
}));

// Parse JSON requests
app.use(express.json());


async function connect() {
  try {
    await mongoose.connect(uri);
    console.log('connected to mango');
  } catch (error) {
    console.log(error)
  }
}

async function updateLastMessage(channelName, message) {
  const activeChannel = await Channel.findOne({ channelName });
  activeChannel.lastMessage = message;
  const saveChannel = await activeChannel.save();
}

connect();

app.post('/user/register', async (req, res) => {
  try {

    const user = new User({
      email: req.body.email,
      name: req.body.name,
      surname: req.body.surname,
      password: req.body.password
    });

    const savedUser = await user.save();
    res.json(savedUser);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const users = await User.find()
    users.forEach(element => {
      if (email === element.email && password === element.password) {
        res.json(element)
      }
    });
  } catch (err) {
    res.send('Error ' + err)
  }
})

app.get('/users-list', async (req, res) => {
  try {
    const users = await User.find()
      res.json(users) 
  } catch (err) {
    res.send('Error ' + err)
  }
})

app.post('/channel-chats', async (req, res) => {
  try {
    const { channelName } = req.body;
    const messages = await Message.find({ channelName })
      res.json(messages) 
  } catch (err) {
    res.send('Error ' + err)
  }
})

// app.post('/users', async(req,res) => {
//   try{
//     const { userId } = req.body
//     const channels = await Channel.find({
//       $or: [
//         { user1: userId },
//         { user2: userId }
//       ]
//     });

//     if (channels.length > 0) {
//       // Extract user IDs from the matching channels
//       const user1Ids = channels.map(channel => channel.user1);
//       const user2Ids = channels.map(channel => channel.user2);
    
//       // Combine user IDs and remove duplicates
//       const allUserIds = Array.from(new Set([...user1Ids, ...user2Ids]));
    
//       // Exclude the provided user ID
//       const unmatchedUserIds = allUserIds.filter(id => id !== userId);
    
//       // Retrieve details of unmatched users
//       const unmatchedUsers = await User.find({ _id: { $in: unmatchedUserIds } });
//       res.json(unmatchedUsers)
//     } else {
//       console.log('No matching channels found for the user ID');
//     }

//     //res.json(unmatchedUsers)
//   }catch(err){
//       res.send('Error ' + err)
//   }
// })

app.post('/users', async (req, res) => {
  try {
    const { userId } = req.body;
    const channels = await Channel.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    });

    if (channels.length > 0) {

      const user1Ids = channels.map(channel => channel.user1);
      const user2Ids = channels.map(channel => channel.user2);

      const allUserIds = Array.from(new Set([...user1Ids, ...user2Ids]));

      const unmatchedUserIds = allUserIds.filter(id => id !== userId);

      const unmatchedUsers = await User.find({ _id: { $in: unmatchedUserIds } });

      const resultArray = [];
      unmatchedUsers.forEach(user => {
        const userChannels = channels.filter(channel => {
          return (
            (channel.user1 === user._id.toString() || channel.user2 === user._id.toString()) &&
            (channel.user1 === userId || channel.user2 === userId)
          );
        });

        resultArray.push({
          user,
          channels: userChannels
        });
      });

      res.json(resultArray);
    } else {
      console.log('No matching channels found for the user ID');
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.post('/api/create-channel', async(req, res) => {
  try {
    const { channelName, user1, user2 } = req.body;
    const existingChannel = await Channel.findOne({ channelName });

    if (existingChannel) {
      res.json({ success: true, message: 'Channel already exists' });
      return existingChannel;
    }


   const channel = new Channel({
       channelName: channelName,
       user1: user1,
       user2: user2,
       lastMessage: null,
       user1LastCheck: null,
       user2LastCheck: null,
     });
     
    pusher.trigger('channel-created', 'new-channel', {
      channelName: channelName,
    });

    const saveChannel = await channel.save();
    
    res.json({ success: true, message: 'Channel created successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/update-channel', async(req, res) => {
  try {
    const { channelName, _id} = req.body;
    const activeChannel = await Channel.findOne({ channelName });
    console.log(_id, '===', activeChannel.user1)
    if (activeChannel.user1 === _id) {
      console.log(Date.now())
      activeChannel.user1LastCheck = Date.now();
    } else {
      console.log(Date.now())
      activeChannel.user2LastCheck = Date.now();
    }

    const saveChannel = await activeChannel.save();
    
    res.json({ success: true, message: 'Channel updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { channelName, message, sender, reciever } = req.body;
    console.log(channelName)
    await pusher.trigger(channelName, 'message', {
      channelName: channelName,
      message: message,
      date: Date.now(),
      sender: sender,
      reciever: reciever
    });



    const messages = new Message({
      channelName: channelName,
      message: message,
      date: Date.now(),
      sender: sender,
      reciever: reciever
    });

    const saveMessage = await messages.save();
    updateLastMessage(channelName, messages)

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Log server start
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

