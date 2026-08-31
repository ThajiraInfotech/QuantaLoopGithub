require("dotenv").config();
const bcrypt = require("bcryptjs");
const { loadEnv } = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../modules/users/user.model");

async function main() {
  const env = loadEnv();
  await connectDatabase(env.MONGO_URI);

  const email = "avinash0301@yahoo.com";
  const password = "QuantaAdmin@2026";
  const hashed = await bcrypt.hash(password, 12);

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        password: hashed,
        hasLocalPassword: true,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    },
    { new: true }
  ).select("+password");

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  const verified = await bcrypt.compare(password, user.password);
  if (!verified) {
    throw new Error("Password hash verification failed");
  }

  process.stdout.write(
    `Password reset for ${email} (role=${user.role}). Login with the temporary password shown in chat.\n`
  );
  await require("mongoose").disconnect();
}

main().catch((err) => {
  process.stderr.write(`${err.message || err}\n`);
  process.exit(1);
});
