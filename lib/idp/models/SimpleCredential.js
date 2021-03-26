import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

let saltRounds = 10;

const SimpleCredentialSchema = new mongoose.Schema({
  userfacade: { type: String, select: false},
  password: { type: String, select: false,},
  ufpwd: { type: String, select: false, unique: true},
  name: { type: String},
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
});

SimpleCredentialSchema.statics.verifyMethod = function(data) {
  return data.password && data.userfacade;
};

SimpleCredentialSchema.statics.configure = function(configs) {
  return true;
};

SimpleCredentialSchema.pre('save', function(next) {
  try{
    if (this.isModified('password') || this.isModified('userfacade')) {

      const salt = bcrypt.genSaltSync(saltRounds);
      this.ufpwd = bcrypt.hashSync(`${this.userfacade}.${this.password}`, saltRounds );

      if (this.isModified('password')) {
        this.password = bcrypt.hashSync(this.password, salt);
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

SimpleCredentialSchema.statics.authenticate = async function({password, userfacade}) {
  const credentials = await Credential.find({userfacade}).select("+ufpwd").exec()

  for (let credential of credentials) {
    if(bcrypt.compareSync(`${userfacade}.${password}`, credential.ufpwd))
      return credential;
  }
  return null;
};

const Credential = mongoose.model("SimpleCredential", SimpleCredentialSchema);
export default Credential;
