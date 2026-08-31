require("dotenv").config();
const { loadEnv } = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../modules/users/user.model");

async function main() {
  const env = loadEnv();
  await connectDatabase(env.MONGO_URI);

  const user = await User.findOne({ email: "thajiratechworks@gmail.com" });
  if (!user) {
    throw new Error("User not found");
  }

  user.role = "material_provider";
  await user.save();

  process.stdout.write(
    `Reverted ${user.email} to role=${user.role}. ADMIN_OTP_FORWARD_EMAIL=${env.ADMIN_OTP_FORWARD_EMAIL || "(not set)"}\n`
  );
  await require("mongoose").disconnect();
}

main().catch((err) => {
  process.stderr.write(`${err.message || err}\n`);
  process.exit(1);
});
