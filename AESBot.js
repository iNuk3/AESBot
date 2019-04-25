const Discord = require('discord.js');
const client = new Discord.Client();
const Fortnite = require("fortnite-api");
const axios = require("axios");

//HEROKU PORT
var express = require('express');
var app     = express();
app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});
//HEROKU NO IDLE
var http = require("http");
setInterval(function() {
    http.get("http://aesbot.herokuapp.com/");
    fortniteAPI.login().then(() => {
        try {
            registerKeys(true);
          }
          catch(error) {
            console.log(error);
          }
    });
}, 300000);

//FORTNITE LOGIN
let fortniteAPI = new Fortnite(
    [
        process.env.epicEMAIL,
        process.env.epicPASSWORD,
        "MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=",
        "ZWM2ODRiOGM2ODdmNDc5ZmFkZWEzY2IyYWQ4M2Y1YzY6ZTFmMzFjMjExZjI4NDEzMTg2MjYyZDM3YTEzZmM4NGQ="
    ],
    {
        debug: true
    }
);

//BOT LOGIN
client.on('ready', () => {
    console.log("Connected as " + client.user.tag)
    console.log("Servers:")
    client.guilds.forEach((guild) => {
        console.log("   - " + guild.name)
    })
    client.user.setStatus("dnd");
    client.user.setActivity("Fortnite AES Keys", { type: "WATCHING"});

    var cron = require('node-cron');
    fortniteAPI.login().then(() => {
        try {
            registerKeys(false);
          }
          catch(error) {
            console.log(error);
          }
    });

    cron.schedule('2 0 0 * * *', () => { // UTC from heroku --> shop rotation + 2 seconds
        fortniteAPI.login().then(() => {
            try {
                registerKeys(true);
              }
              catch(error) {
                console.log(error);
              }
        });
      });
});
//BOT PREFIX
client.on('message', (receivedMessage) => {
    if (receivedMessage.author == client.user) { // Prevent bot from responding to its own messages
        return
    }
    
    if (receivedMessage.content.startsWith(process.env.botPREFIX)) {
        processCommand(receivedMessage)
    }
});
//BOT COMMANDS
function announcements(channelID, text)
{
    var textToCheck = text;
    if (textToCheck.includes("<taghere>"))
    {
        textToCheck = textToCheck.replace("<taghere>", "@here");
    }
    if (textToCheck.includes("<tageveryone>"))
    {
        textToCheck = textToCheck.replace("<tageveryone>", "@everyone");
    }
    var textToSend = textToCheck;
    client.channels.get(channelID).send(textToSend);
}
function processCommand(receivedMessage) {
    let fullCommand = receivedMessage.content.substr(process.env.botPREFIX.length) // No prefix
    let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
    let primaryCommand = splitCommand[0] // The first word directly after the prefix is the command
    let firstArguments = splitCommand[1]
    let otherArguments = splitCommand.slice(2).join(" ")

    console.log("Command: " + process.env.botPREFIX + primaryCommand)
    console.log("Author: " + receivedMessage.author.tag + "\t\t" + receivedMessage.author)
    var fullArg = otherArguments.replace("\n", " <new_line> ")
    console.log("Arguments: " + firstArguments + " " + fullArg) // There may not be any arguments

    if (primaryCommand == "aes") {
        receivedMessage.channel.send(receivedMessage.author + " " + process.env.sAESKEY)
    }
    else if (primaryCommand == "faes")
    {
        if (receivedMessage.member.roles.some(role => role.name === 'Master'))
        {
            receivedMessage.delete();
            try {
                fortniteAPI.login().then(() => {
                    try {
                        registerKeys(true);
                      }
                      catch(error) {
                        console.log(error);
                      }
                });
              }
              catch(error) {
                console.log(error);
              }
        }
        else
        {
            receivedMessage.channel.send(receivedMessage.author + " You don't have enough permissions to use this command.");
        }
    }
    else if (primaryCommand == "clear")
    {
        if (receivedMessage.member.hasPermission("MANAGE_MESSAGES")) {
            receivedMessage.channel.fetchMessages({ limit: parseInt(firstArguments) + 1 })
               .then(function(list){
                   receivedMessage.channel.bulkDelete(list);
                }, function(err){console.log(err)})
        }
    }
    else if (primaryCommand == "ann")
    {
        receivedMessage.delete();
        if (receivedMessage.member.roles.some(role => role.name === 'Moderator'))
        {
            try {
                announcements(firstArguments, otherArguments);
            }
            catch(error) {
                console.log(error);
            }
        }
        else
        {
            receivedMessage.channel.send(receivedMessage.author + " You don't have enough permissions to use this command.");
        }
    }
    else if (primaryCommand == "help")
    {
        help(receivedMessage);
    }
    else {
        receivedMessage.channel.send("I don't understand the command. Try `" + process.env.botPREFIX + "aes`, `" + process.env.botPREFIX + "faes` or `" + process.env.botPREFIX + "ann channelid message`")
    }
}
//BOT HELP
function help(receivedMessage)
{
    const embed = new Discord.RichEmbed()
  .setAuthor(client.user.username + "'s Help", client.user.avatarURL)
  .setColor([119, 57, 59])
  //.setThumbnail(client.user.avatarURL)
  //.setTimestamp()
  .addField("Main Commands",
  "- `" + process.env.botPREFIX + "aes` Sends the latest Fortnite Static AES Key\n")
  .addField("Mods Command","- `" + 
  process.env.botPREFIX + "faes` Force to update the latest Fortnite Dynamic AES Keys in <#" + process.env.aesCHANNELID + ">\n- `" + 
  process.env.botPREFIX + "ann channelid message` Sends messages using the bot as the announcer\n- `" + 
  process.env.botPREFIX + "clear amount` It does what it says, default amount is set to 100\n", true)

  receivedMessage.channel.send({embed});
}

//FORTNITE LATEST PAKS GUID
var dict = {
    "560829776-1890430736-2537279830-2306110147": "pakchunk1000-WindowsClient.pak",
    "738118893-3563313416-3325311229-1964321214": "pakchunk1001-WindowsClient.pak",
    "1190944442-3550274878-4213266990-94967292": "pakchunk1002-WindowsClient.pak",
    "1435256579-1146701242-28877991-4121881694": "pakchunk1003-WindowsClient.pak",
    "1451306396-3053975338-2614865390-1156369697": "pakchunk1004-WindowsClient.pak",
    "1529238379-717985596-1696337178-677121591": "pakchunk1005-WindowsClient.pak",
    "1930647834-3119556580-1789924870-1575548506": "pakchunk1006-WindowsClient.pak",
    "2201347039-2332949451-201715637-4279995009": "pakchunk1007-WindowsClient.pak",
    "2981626081-2577847396-2458370330-3902760906": "pakchunk1008-WindowsClient.pak",
    "3566688226-3579072928-3585294736-1877126116": "pakchunk1009-WindowsClient.pak",
    "3614604102-2527470451-3924547968-1064327996": "pakchunk1010-WindowsClient.pak",
    "4034650749-3472749864-418282402-3449595140": "pakchunk1011-WindowsClient.pak",
};
function splitGUID(input, len) {
    return input.match(new RegExp('.{1,' + len + '}(?=(.{' + len + '})+(?!.))|.{1,' + len + '}$', 'g'))
};

//FORTNITE GET AES
var fs = require('fs');
var  arrayDiff = require('simple-array-diff');
function registerKeys(compare)
{
    if (compare == true)
    {
        var oldKeys = fs.readFileSync('aes.txt').toString().split("\n");
    }

    let headers = {};
    headers["X-EpicGames-Language"] = "en";
    headers["Authorization"] = "bearer " + fortniteAPI.access_token;
    axios({
        url: "https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/storefront/v2/keychain",
        method: "GET",
        headers : headers,
        responseType: "json"
    }).then(data => {
        var sKeys = data.data;
        fs.writeFileSync("aes.txt", sKeys.toString().split(',').join('\n'), function(err) {
            if(err) {
                return console.log(err);
            }
        });

        var lineReader = require('readline').createInterface({
            input: require('fs').createReadStream('aes.txt')
          });

        if (fs.existsSync("AESKeys.txt")) {
            var data = fs.readFileSync('AESKeys.txt', 'utf-8');
            var newValue = data.replace(data, '');
            fs.writeFileSync('AESKeys.txt', newValue, 'utf-8');
            //console.log("AESKeys.txt cleared");
        }
        else
        {
            fs.writeFileSync('AESKeys.txt', '', 'utf-8');
            //console.log("AESKeys.txt created");
        }

        lineReader.on('line', function (line) {
            convert(line, false);
        });
        //console.log("Keys added to file");

        if (compare == true)
        {
            var newKeys = fs.readFileSync('aes.txt').toString().split("\n");
            var diffpls = arrayDiff(oldKeys, newKeys);
            for(i in diffpls.added) {
                console.log(diffpls.added[i]);
                convert(diffpls.added[i], true);
            }
        }
    }).catch(err => {
        console.log(err);
    });
};
function convert(theLines, send)
{
    var parts = theLines.split(':');

    var guid = splitGUID(parts[0], 8);
    var pakGUID = "";
    var c = 0;
    for (var i = 0; i < guid.length; i++)
    {
        c += 1;
        if (c != guid.length)
        {
            pakGUID += parseInt(guid[i], 16) + "-";
        }
        else
        {
            pakGUID += parseInt(guid[i], 16);
        }
    }
    
    var key = parts[1];
    var aeskey = "";
    try{
        let buff = Buffer.from(key, 'base64').toString('hex');
        aeskey = buff;
    }
    catch(error) {
        console.log(error);
    }
    
    var item = parts[2];
    
    var output = "";
    var result = dict[pakGUID] === undefined;
    if (!result)
    {
        output += "0x" + aeskey.toString().replace('-', '').toUpperCase() + " - **" + item + "** - " + dict[pakGUID] + "\n";
        if (send == true)
        {
            client.channels.get(process.env.aesCHANNELID).send(output);
        }
    }
    else
    {
        output += "0x" + aeskey.toString().replace('-', '').toUpperCase() + " - " + item + "\n";
        if (send == true)
        {
            client.channels.get(process.env.aesCHANNELID).send(output);
        }
    }
    fs.appendFileSync('AESKeys.txt', output, function (err) {
        if (err) console.log(err);
    });
}

bot_secret_token = process.env.botTOKEN;
client.login(bot_secret_token);