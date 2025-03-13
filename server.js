require("dotenv").config();
const express = require("express");
const mqtt = require("mqtt");
const admin = require("firebase-admin");
// Convert private key (Handle newlines properly)
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};
// Initialize Firebase

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shaka-firebase-default-rtdb.firebaseio.com/", // Replace with your database URL
});

const db = admin.database();
const ref = db.ref("sensor_data"); // Firebase path

// Initialize Express
const app = express();
app.use(express.json());

// MQTT Broker Settings
const mqttBroker = "mqtts://cb924a46fdbd4c65b65748e464635988.s1.eu.hivemq.cloud:8883";
const mqttUser = "SHAKA";
const mqttPassword = "Shaka1234";

const client = mqtt.connect(mqttBroker, {
  username: mqttUser,
  password: mqttPassword,
  rejectUnauthorized: false, // Required for HiveMQ SSL
});

client.on("connect", () => {
  console.log("✅ Connected to HiveMQ MQTT Broker!");
  client.subscribe("sensor/data", (err) => {
    if (err) console.error("MQTT Subscription Error:", err);
    else console.log("📡 Subscribed to sensor/data topic!");
  });
});

// Listen for MQTT messages
client.on("message", (topic, message) => {
  console.log(`📥 Received data on topic ${topic}: ${message.toString()}`);

  const data = JSON.parse(message.toString()); // Parse JSON

  // Save to Firebase
  ref.push(data, (error) => {
    if (error) console.error("❌ Firebase Write Failed:", error);
    else console.log("✅ Data stored in Firebase!");
  });
});

// Start Express Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
