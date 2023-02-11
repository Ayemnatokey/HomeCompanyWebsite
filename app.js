const { Client, MessageEmbed } = require("discord.js");
const client = new Client({ fetchAllMembers: true });
const express = require("express");
const ejs = require("ejs");
const passport = require("passport");
const { Strategy } = require("passport-discord");
const app = express();
app.listen(80);
const moment = require("moment");
moment.locale("tr");
const url = require("url");
const request = require("request");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const settings = require("./src/configs/config.json");
const conf = require("./src/configs/config.json");

client.login(conf.token).then(() => console.log("Giriş başarılı!")).catch(() => console.log("Giriş Başarısız!"));

client.on("ready", () => {
client.user.setPresence({ activity: { name: conf.botSettings.game, type: conf.botSettings.status }, status: "idle" })
});

client.on("ready", async () => {
//console.log(client.guilds.cache.filter(x => !x.name.includes('Homé')).map(x => x.name))
})

app.engine(".ejs", ejs.__express);
app.set("view engine", "ejs");
app.set("views", __dirname + "/src/views");
app.use(express.static(`${__dirname}/src/views/`));
app.use(session({ secret: "secret-session-thing", resave: false, saveUninitialized: false, }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false, }));
app.use(cookieParser());

passport.serializeUser(async(user, done) => {
  const channel = client.channels.cache.get(conf.channels.siteyegirislog);
  const clientUser = await client.users.fetch(user.id);
  const embed = new MessageEmbed()
    .setThumbnail(channel.guild.iconURL({ dynamic: true }))
    .setAuthor(clientUser.username, clientUser.avatarURL({ dynamic: true }))
    .setColor("#ff3f56")
    .setFooter(client.user.username, client.user.avatarURL())
    .setTitle("Siteye yeni giriş sağlandı!")
    .setDescription(`
**Kullanıcı adı:** ${clientUser.tag}
**Kullanıcı ID:** ${clientUser.id}
**Hesap Oluşturma Tarihi:** ${moment(clientUser.createdTimestamp).format("LLL")} (\`${moment(clientUser.createdTimestamp).fromNow()}\`)`);
  channel.send(embed);
  return done(null, user);
});
passport.deserializeUser((obj, done) => done(null, obj));

const scopes = ["identify", "guilds"];
passport.use(new Strategy({ clientID: conf.clientID, clientSecret: conf.clientSecret,  callbackURL: conf.callbackURL, scope: scopes, }, (accessToken, refreshToken, profile, done) => process.nextTick(() => done(null, profile))));

app.use(passport.initialize());
app.use(passport.session());

app.get("/login", passport.authenticate("discord", { scope: scopes, }));
app.get("/callback", passport.authenticate("discord", { failureRedirect: "/error", }), (req, res) => res.redirect("/"));
app.get("/logout", (req, res) => {
  req.logOut();
  return res.redirect("/");
});

app.get("/", (req, res) => {
  res.render("index", { url: req.originalUrl, user: req.user });
});

app.get("/members", (req, res) => {
  const guild = client.guilds.cache.get(conf.guildID);
  const founders = guild.roles.cache.get(conf.roles.founderRole).members;
  const moderators = guild.roles.cache.get(conf.roles.moderatorRole).members;
  const members = guild.roles.cache.get(conf.roles.memberRole).members;
  res.render("members", { founders, moderators, members, url: req.originalUrl, user: req.user  });
});

app.get("/company", (req, res) => {
  const request = require('request')
  const devclient = new Client()
  
const fetchinvitee = async(invitecode) => {
 return await client.fetchInvite(invitecode)
}
  res.render("company", {url: req.originalUrl, user: req.user, request: require('request'), bot: client, fetch: fetchinvitee});
});

app.get("/error", (req, res) => {
  res.render("error", {
    user: req.user,
    statuscode: req.query.statuscode,
    message: req.query.message,
    url: req.originalUrl,
    user: req.user 
  });
});

app.get("/companybasvuru", (req, res) => {
  if (!req.user) return error(res, 138, "Company başvurusunda bulunabilmek için siteye giriş yapmanız gerekmektedir!");
  res.render("companybasvuru", { url: req.originalUrl, user: req.user  });
});

app.get("/error", (req, res) => {
  res.render("error", {
    user: req.user,
    statuscode: req.query.statuscode,
    message: req.query.message,
    url: req.originalUrl,
    user: req.user 
  });
});

app.post("/companybasvuru", async (req, res) => {
  if (!req.user) return error(res, 138, "Company başvurusunda bulunabilmek için siteye giriş yapmanız gerekmektedir.");

 const channel = client.channels.cache.get(conf.channels.companybasvurulog);
  const member = channel.guild.members.cache.get(req.user.id);
  const clientUser = client.users.cache.get(req.user.id);
  console.log(req.body.position)
  const embed = new MessageEmbed()
    .setThumbnail(channel.guild.iconURL({ dynamic: true }))
    .setAuthor(`${clientUser.username} Company Başvurusunda Bulundu!`, clientUser.avatarURL({ dynamic: true }))
    .setColor("#ff3f56")
    .setDescription(`
**Kullanıcı:**  \`${req.user.id}\`
**Discord Kullanıcı Adı ve ID'si:** \`${req.body.name}\`
**E-mail:** \`${req.body.email}\`
**Discord Üzerinde Yaptığınız İşleri Özetleyin:** \`${req.body.is}\`

**Sunucu Adı:** \`${req.body.sunucuadi}\`
**Sunucu ID'si:** \`${req.body.sunucuid}\`
**Sunucunun Davet Linki:** \`${req.body.sunuculink}\`
**Sunucunuzdan Bahsedin:** \`${req.body.whyYourServer}\`
**Neden Homé Company?:** \`${req.body.whyHoméCompany}\`
**Şartlar** \`${req.body.sartlar}\`

**Eklemek İstediğiniz Bir Şey Var Mı?:** \`${req.body.eklist}\``);
  const message = await channel.send(`@everyone`,embed);
  return res.redirect("/");
});

app.use((req, res) => error(res, 404, "Sayfa bulunamadı!"));

const error = (res, statuscode, message) => {
  return res.redirect(url.format({ pathname: "/error", query: { statuscode, message }}));
};
