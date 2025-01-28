const express = require('express');
const mongoose = require('mongoose');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 

// Middleware to parse JSON
app.use(express.json());

const cors = require('cors');
app.use(cors({
    origin: 'https://taskapp-lilac.vercel.app', // Replace '*' with your frontend URL for better security
  }));
// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://sodagaramaan786:HbiVzsmAJNAm4kg4@cluster0.576stzr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo error", err));

// User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);


// Appointment schema
const appointmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    position: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: Date, required: true },
  });
  
  const Appointment = mongoose.model('Appointment', appointmentSchema);



// Register 
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log("Received registration request:", { username, email, password });
  
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        console.log("Registration failed: Username or email already exists.");
        return res.status(400).json({ message: 'Username or email already exists' });
      }
  
      // Save the new user in the database
      const newUser = new User({ username, email, password });
      await newUser.save();
  
      // Log the details of the newly registered user
      console.log("User registered successfully:", newUser);
  
      // Respond to the client
      res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
      console.error("Error during registration:", err.message);
      res.status(500).json({ message: 'An error occurred', error: err.message });
    }
  });
  
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ userId: user._id, username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
  
      res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
      res.status(500).json({ message: 'An error occurred', error: err.message });
    }
  });

 // Get all appointments for HRs
app.get('/api/appointments', async (req, res) => {
    try {
      const appointments = await Appointment.find();
      res.status(200).json(appointments);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching appointments', error: err.message });
    }
  });
  
  // Check if a time slot is available
  app.get('/api/appointments/check-time', async (req, res) => {
    const { date, time } = req.query; // Date and time passed from frontend
  
    try {
      const appointment = await Appointment.findOne({ date, time });
      if (appointment) {
        return res.status(400).json({ message: 'Time slot already booked' });
      }
      res.status(200).json({ message: 'Time slot available' });
    } catch (err) {
      res.status(500).json({ message: 'Error checking time slot', error: err.message });
    }
  });
  
  // Create an appointment
  app.post('/api/appointments', async (req, res) => {
    const { name, position, date, time } = req.body;
    
    try {
      // Check if the time is already taken
      const existingAppointment = await Appointment.findOne({ date, time });
      if (existingAppointment) {
        return res.status(400).json({ message: 'Time slot already booked' });
      }
  
      const newAppointment = new Appointment({ name, position, date, time });
      await newAppointment.save();
      res.status(201).json({ message: 'Appointment scheduled' });
    } catch (err) {
      res.status(500).json({ message: 'Error creating appointment', error: err.message });
    }
  });
  
  // Update an appointment
  app.put('/api/appointments/:id', async (req, res) => {
    const { name, position, date, time } = req.body;
  
    try {
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { name, position, date, time },
        { new: true }
      );
      res.status(200).json(updatedAppointment);
    } catch (err) {
      res.status(500).json({ message: 'Error updating appointment', error: err.message });
    }
  });
  
  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      res.json(appointment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });


  // Delete an appointment
  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      await Appointment.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: 'Appointment deleted' });
    } catch (err) {
      res.status(500).json({ message: 'Error deleting appointment', error: err.message });
    }
  });
  





app.get('/', (req, res) => {
    res.send('Hello World!')
    })

// Start the server
app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});