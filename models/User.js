import mongoose from 'mongoose';

// Delete any cached models to avoid conflicts
delete mongoose.models.User;
delete mongoose.connection.models.User;

// Define GeoJSON Polygon schema
const polygonSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Polygon'],
    required: true
  },
  coordinates: {
    type: [[[Number]]],
    required: true,
    validate: {
      validator: function(coords) {
        return coords.length > 0 && coords[0].length >= 4;
      },
      message: 'Polygon must have at least one ring with minimum 4 coordinates'
    }
  }
});

// Define the main User schema - NO location field, only geoData
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [1, 'Age must be at least 1'],
    max: [120, 'Age cannot exceed 120']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  taluka: {
    type: String,
    required: [true, 'Taluka is required'],
    trim: true,
    maxlength: [50, 'Taluka name cannot exceed 50 characters']
  },
  communityName: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true,
    maxlength: [100, 'Community name cannot exceed 100 characters']
  },
  conflict: {
    type: Boolean,
    required: [true, 'Conflict status is required'],
    default: false
  },
  geoData: {
    type: polygonSchema,
    required: [true, 'Geographic data is required']
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
userSchema.index({ geoData: '2dsphere' });

// Force create a new model
const User = mongoose.model('User', userSchema, 'ab');

export default User;
