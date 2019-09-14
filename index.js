const Discord = require ('discord.js');
const req = require('request');
const teams = require('./data/teams.json');
const {table, getBorderCharacters} = require('table');
let date = require('date-and-time');
var Twit = require('twit');
var fs = require('fs');
var text2png = require('text2png');

const bot = new Discord.Client();
const trigger = "?";

var calendar_date = "";
var season = "";
var error;

var temp;

today();

var T = new Twit({
    consumer_key: 'khDF8DUC0iL3MiOlv4an9nP0S',
    consumer_secret: '6GsDr4S6KKpZDjytEWoXXGuVcgemaaJBx62oq70YSuetaWKFIt',
    access_token: '867463133039915009-WzGsGAwsBZubilVhecaFTTnWXwMeF7x',
    access_token_secret: 'lnXNX1skLCbKOCGNTnmMkdB2HHgfScRNiZAnXMHE4QUTg'
  });

var stream = T.stream('statuses/filter', { follow: ['3444040513', '19923144'] });

stream.on('tweet', function(data){
    if (data.user.id_str == '3444040513'){
        bot.channels.get("572598054881067036").send("https://twitter.com/" + data.user.screen_name + "/status/" + data.id_str);
    }
});

bot.on('message', (message) => {
    bot.user.setActivity('DM errors/suggestions');

    if (message.channel.type == "dm"){
        var author = message.author;
        if (author != "<@572204160959643688>"){
        bot.channels.get("562481794520317962").send(author + " " + message.content);
        }
    }

    if (message.content.startsWith(trigger + "how2ball")){
        message.author.send("```\nPlaceholder```");
    }

    if (message.content.startsWith(trigger + "live")){
        
        let input, output, config; //Parameters for the 'table' dependancy 

        input = [["Away", ' ', 'Time', ' ', 'Home']];

        req({uri: "http://data.nba.net/10s/prod/v1/" + calendar_date + "/scoreboard.json", json: true},(error, response, body) => {
            
            for (var i = 0; i < (body.games.length); i++){ //Loop through all the games
                var scoreH, scoreV, home, away;

                scoreH = body.games[i].hTeam.score; //Home and Visitor scores
                scoreV = body.games[i].vTeam.score;

                home = body.games[i].hTeam.triCode; //Home and Visitor team abbrevations 
                away = body.games[i].vTeam.triCode;
                
                var status = body.games[i].statusNum
                var time = body.games[i].period.current; //Current quarter
                
                if (status == 1){
                    time = body.games[i].startTimeEastern;
                }
                else if (status == 3){
                    time = "Final";
                }
                else if (time == 1){
                    time = time + "st Qtr "+ body.games[i].clock;
                }
                else if (time == 2){
                    if (body.games[i].period.isHalftime == true){
                        time = "Halftime";
                    }
                    else{
                    time = time + "nd Qtr "+ body.games[i].clock;
                    }
                }
                else if (time == 3){
                    time = time + "rd Qtr "+ body.games[i].clock;
                }
                else if (time == 4){
                    time = time + "th Qtr "+ body.games[i].clock;
                }
                else if (time == 0){
                    time = "Pre-Game";
                }
                else if (body.games[i].isGameActivated == false){
                    time = "Final";
                }
                else{
                    time = time + "OT "+ body.games[i].clock;
                }

                input.push([away,scoreV,time,scoreH,home]);
                
            }
            output = table(input, config);
            message.channel.send("```\n" + output + "```");
            temp = output

            });

    }

    if (message.content.startsWith(trigger + "boxscore")){
        var gameDate, gameID = "";
        var teamID = message.content.replace(trigger + "boxscore ", '');
        
        teamID = teamIdFromName(teamID);
        var teamAbv = teamAbvFromID(teamID)

        let input, output, config; //Parameters for the 'table' dependancy 

        input = [["Player", 'Min', 'Pts', 'FGM-A', '3PM-A', 'FTM-A', 'Reb', 'Ast', 'Stl', 'Blk', 'Tov', 'Pf', '+/-']];

        req({uri: "http://data.nba.net/prod/v1/" + season + "/teams/" + teamID + "/schedule.json", json: true},(error, response, body) => {
            var index = body.league.lastStandardGamePlayedIndex;
            
            gameDate = body.league.standard[index].startDateEastern;
            gameID = body.league.standard[index].gameId;

            let now = new Date();
            now = date.format(now, 'HHmm');

            try{
                if (body.league.standard[index + 1].startDateEastern == calendar_date && now >= body.league.standard[index + 1].homeStartDate){
                    gameDate = calendar_date;
                    gameID = body.league.standard[index + 1].gameId;
                }
            } catch (err){
                
            }

            req({uri: "http://data.nba.net/json/cms/noseason/game/" + gameDate + "/" + gameID + "/boxscore.json", json: true},(error, response, body) => {
                var numOfPlayers
                var teamState

                if (body.sports_content.game.home.team_key == teamAbv){
                    numOfPlayers = body.sports_content.game.home.players.player.length;
                    teamState = 'home'
                }

                else{
                    numOfPlayers = body.sports_content.game.visitor.players.player.length;
                    teamState = 'visitor'
                }

                var name, minutes, pts, fgma, fgpct, tpma, tpp, ftma, ftp, reb, ast, stl, blk, tov, pf, pm, seconds

                if (teamState == 'home'){
                    for (var i = 0; i < numOfPlayers; i++){
                        var firstNameLetter = body.sports_content.game.home.players.player[i].first_name
                        firstNameLetter = firstNameLetter.substring(0,1)
    
                        name = firstNameLetter + "." + body.sports_content.game.home.players.player[i].last_name
                        minutes = body.sports_content.game.home.players.player[i].minutes
                        seconds = body.sports_content.game.home.players.player[i].seconds
                        pts = body.sports_content.game.home.players.player[i].points
                        fgma = body.sports_content.game.home.players.player[i].field_goals_made + '-' + body.sports_content.game.home.players.player[i].field_goals_attempted
                        tpma = body.sports_content.game.home.players.player[i].three_pointers_made + '-' + body.sports_content.game.home.players.player[i].three_pointers_attempted
                        ftma = body.sports_content.game.home.players.player[i].free_throws_made + '-' + body.sports_content.game.home.players.player[i].free_throws_attempted
                        reb = +body.sports_content.game.home.players.player[i].rebounds_offensive + +body.sports_content.game.home.players.player[i].rebounds_defensive
                        ast = body.sports_content.game.home.players.player[i].assists
                        stl = body.sports_content.game.home.players.player[i].steals
                        blk = body.sports_content.game.home.players.player[i].blocks
                        tov = body.sports_content.game.home.players.player[i].turnovers
                        pf = body.sports_content.game.home.players.player[i].fouls
                        pm = body.sports_content.game.home.players.player[i].plus_minus

                        if (seconds.length != 2){
                            seconds = '0' + seconds
                        }

                        minutes = minutes + ':' + seconds
    
                        input.push([name, minutes, pts, fgma, tpma, ftma, reb, ast, stl, blk, tov, pf, pm]);
                    }
                }

                else if (teamState == 'visitor'){
                    for (var i = 0; i < numOfPlayers; i++){
                        var firstNameLetter = body.sports_content.game.visitor.players.player[i].first_name
                        firstNameLetter = firstNameLetter.substring(0,1)
    
                        name = firstNameLetter + "." + body.sports_content.game.visitor.players.player[i].last_name
                        minutes = body.sports_content.game.visitor.players.player[i].minutes
                        seconds = body.sports_content.game.visitor.players.player[i].seconds
                        pts = body.sports_content.game.visitor.players.player[i].points
                        fgma = body.sports_content.game.visitor.players.player[i].field_goals_made + '-' + body.sports_content.game.visitor.players.player[i].field_goals_attempted
                        tpma = body.sports_content.game.visitor.players.player[i].three_pointers_made + '-' + body.sports_content.game.visitor.players.player[i].three_pointers_attempted
                        ftma = body.sports_content.game.visitor.players.player[i].free_throws_made + '-' + body.sports_content.game.visitor.players.player[i].free_throws_attempted
                        reb = +body.sports_content.game.visitor.players.player[i].rebounds_offensive + +body.sports_content.game.visitor.players.player[i].rebounds_defensive
                        ast = body.sports_content.game.visitor.players.player[i].assists
                        stl = body.sports_content.game.visitor.players.player[i].steals
                        blk = body.sports_content.game.visitor.players.player[i].blocks
                        tov = body.sports_content.game.visitor.players.player[i].turnovers
                        pf = body.sports_content.game.visitor.players.player[i].fouls
                        pm = body.sports_content.game.visitor.players.player[i].plus_minus

                        if (seconds.length != 2){
                            seconds = '0' + seconds
                        }

                        minutes = minutes + ':' + seconds
    
                        input.push([name, minutes, pts, fgma, tpma, ftma, reb, ast, stl, blk, tov, pf, pm]);
                    }
                }

                output = table(input, {
                    border: getBorderCharacters(`void`),
                    columnDefault: {
                        paddingLeft: 1,
                        paddingRight: 1
                    },
                    drawHorizontalLine: () => {
                        return false
                    }
                });

                message.channel.send("```\n" + output + "```")
            });
        });


    }

    if (message.content.startsWith(trigger + "roster")){

        var teamID = message.content.replace(trigger + "roster ", '');
        teamID = teamIdFromName(teamID);

        var teamSimpleName = teamSimpleNameFromID(teamID)
        
        let input, output, config; //Parameters for the 'table' dependancy 

        input = [["Name", 'Number', 'Position', 'Height', 'Weight(lbs)']];

        req({uri: "http://data.nba.net/json/cms/noseason/team/" + teamSimpleName.toLowerCase() + "/roster.json", json: true},(error, response, body) => {

            var numOfPlayers = body.sports_content.roster.players.player.length

            for (var i = 0; i < numOfPlayers; i++){ //Loop through all the games
                var name, number, position, height, weight, affiliation

                name = body.sports_content.roster.players.player[i].first_name + " " + body.sports_content.roster.players.player[i].last_name
                number = body.sports_content.roster.players.player[i].jersey_number
                position = body.sports_content.roster.players.player[i].position_full
                height = body.sports_content.roster.players.player[i].height_ft + "'" + body.sports_content.roster.players.player[i].height_in + '"'
                weight = body.sports_content.roster.players.player[i].weight_lbs
                affiliation = body.sports_content.roster.players.player[i].affiliation
                    

                input.push([name, number, position, height, weight]);
                
            }
            output = table(input, {
                    border: getBorderCharacters(`void`),
                    columnDefault: {
                        paddingLeft: 1,
                        paddingRight: 1
                    },
                    drawHorizontalLine: () => {
                        return false
                    }
                });
            message.channel.send("```\n" + output + "```");
            temp = output

            });

    }

    if (message.content.startsWith(trigger + "standings")){

        let input, output, config; //Parameters for the 'table' dependancy 

        input = [["",' ','','Record','GB',' ', '','Record','GB']];

        req({uri: "http://data.nba.net/json/cms/" + season + "/standings/conference.json", json: true},(error, response, body) => {

            for (var i = 0; i < 15; i++){ //Loop through all the games
                var seed, wc, wcr, wcgb, ec, ecr, ecgb

                seed = i + 1

                wc = body.sports_content.standings.conferences.West.team[i].abbreviation
                wcr = body.sports_content.standings.conferences.West.team[i].team_stats.wins + "-" + body.sports_content.standings.conferences.West.team[i].team_stats.losses
                wcgb = body.sports_content.standings.conferences.West.team[i].team_stats.gb_conf

                ec = body.sports_content.standings.conferences.East.team[i].abbreviation
                ecr = body.sports_content.standings.conferences.East.team[i].team_stats.wins + "-" + body.sports_content.standings.conferences.East.team[i].team_stats.losses
                ecgb = body.sports_content.standings.conferences.East.team[i].team_stats.gb_conf

                wcgb = JSON.stringify(wcgb)
                wcgb = wcgb.replace(/\s/g, "");
                wcgb = wcgb.replace(/"/g, "");
                
                ecgb = JSON.stringify(ecgb)
                ecgb = ecgb.replace(/\s/g, "");
                ecgb = ecgb.replace(/"/g, "");
                    

                input.push([seed, , wc, wcr, wcgb, , ec, ecr, ecgb]);
                
            }
            output = table(input, {
                border: getBorderCharacters(`void`),
                columnDefault: {
                    paddingLeft: 0,
                    paddingRight: 2
                },
                drawHorizontalLine: () => {
                    return false
                }
            });
            message.channel.send("```\n" + output + "```");
            });

    }

    if (message.content.startsWith("test")){
        const exampleEmbed = new Discord.RichEmbed()
	.setColor('#0099ff')
	.addField('Live Scores', temp)
	.addBlankField()
	.setTimestamp()

        message.channel.send(exampleEmbed);
    }
    
});

function today(){
    req({uri: "http://data.nba.net/json/cms/today.json", json: true},(error, response, body) => {
        calendar_date = body.sports_content.sports_meta.season_meta.calendar_date;
        season = body.sports_content.sports_meta.season_meta.season_year;
    });
}

function teamIdFromName (name) {
    const n = name.toLowerCase();
    const team = teams.find(function (t) {
      return (
        t.abbreviation.toLowerCase() === n ||
        t.location.toLowerCase() === n ||
        t.teamName.toLowerCase() === n ||
        t.simpleName.toLowerCase() === n
      );
    });
    
    return team ? team.teamId : null;
}

function teamAbvFromID (id) {
    const team = teams.find(function (t) {
      return (
        t.teamId === id
      );
    });
    
    return team ? team.abbreviation : null;
}

function teamSimpleNameFromID (id) {
    const team = teams.find(function (t) {
      return (
        t.teamId === id
      );
    });
    
    return team ? team.simpleName : null;
}

bot.login('NTcyMjA0MTYwOTU5NjQzNjg4.XMY42g.RATmyezXKGm_9C8mudYa-vRmIvg');