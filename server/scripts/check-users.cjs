const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vectorbank');
  const users = await mongoose.connection.db.collection('users').find({}).project({ email: 1, name: 1, role: 1 }).toArray();
  console.log('Usuarios encontrados:', users.length);
  users.forEach(u => console.log(`  - ${u.name} <${u.email}> rol: ${u.role}`));
  await mongoose.disconnect();
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
