const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function main() {
  const email = process.argv[2];
  const newPass = process.argv[3];
  if (!email || !newPass) {
    console.log('Uso: node scripts/reset-pass.cjs <email> <nueva-contrasena>');
    process.exit(1);
  }

  await mongoose.connect('mongodb://127.0.0.1:27017/vectorbank');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPass, salt);

  const result = await mongoose.connection.db.collection('users').updateOne(
    { email },
    { $set: { password: hash } }
  );

  console.log(result.modifiedCount > 0
    ? `✅ Contraseña actualizada para ${email}`
    : `❌ Usuario ${email} no encontrado`);

  await mongoose.disconnect();
}

main().catch(console.error);
