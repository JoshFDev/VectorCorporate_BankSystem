const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vectorbank');
  const result = await mongoose.connection.db
    .collection('users')
    .updateOne(
      { email: 'jaboytes.sebastian@gmail.com' },
      { $set: { role: 'admin', isVerified: true } }
    );
  console.log(
    result.modifiedCount > 0
      ? '✅ Joshua ahora es admin'
      : '❌ Usuario no encontrado'
  );
  await mongoose.disconnect();
}

main().catch(console.error);
