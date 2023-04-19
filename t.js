var ybApp =
`
<audio id="myAudio">
    <source src="https://bigsoundbank.com/UPLOAD/ogg/0218.ogg" type="audio/ogg">
</audio>
<audio id="myAudioNoisy">
https://bigsoundbank.com/UPLOAD/mp3/1111.mp3?v=d
<!-- source src="https://www.w3schools.com/jsref/horse.ogg" type="audio/ogg"  >
<source src="https://bigsoundbank.com/UPLOAD/ogg/1111.ogg" type="audio/ogg"
-->
<source src="https://bigsoundbank.com/UPLOAD/ogg/1111.ogg" type="audio/ogg" >
https://bigsoundbank.com/UPLOAD/mp3/1111.mp3?v=d
</audio>


<style>
.tooltip .tooltiptext {
    visibility: hidden;
    background: black;
    color: white;
    right: -301px;
    position: absolute;
}  

.tooltip:hover .tooltiptext {
    visibility: visible;
}
</style>


<script>
function playAudio(noisy) {
var id = noisy ? "myAudioNoisy" : "myAudio";
var x = document.getElementById(id);
x.play();
}
</script>
`


$('body').append(ybApp);

if (window.ybInter) clearInterval(window.ybInter);
window.ybInter = setInterval(() => {
    //console.log('testing for activity');
    //console.log('got active:', $('#tabs .activity label').length);
    // close the stupid iframe
    $("#youtube_container .tab-close").click()

    if ($('#tabs .activity label').length) { playAudio(); }
}, 1000);



if (!window.oldPraseTriggerIncome) window.oldPraseTriggerIncome = Handlers.PoolHandler.PraseTriggerIncome;

// handle simple search returns
Handlers.PoolHandler.PraseTriggerIncome = function(n) {
    //console.log(n);
    window.oldPraseTriggerIncome(n);
    var t = Tools.StringToJson(n);
    if (t && t.PipeType == 1 && t.Content && t.Content.ActionType == 21) {
        var state = window.ybState ;
        // this is a search
        if (state &&  state.lastSearch && state.lastSearch.searchText == t.Content.Data.searchText)
        {
            var found = t.Content.Data.Users;
            $('#popup-Search-close').click();
            if (found && found.length) {    
                console.log("you searched for", state.lastSearch.searchText, "got us", found);
                //window.ybFuncs.clearSearch();
                ybFuncs.found(state.lastSearch.searchText, found)
                if (window.playAudio) window.playAudio(true)
            }
        }
        console.log(t);
    }    
}

var tryParseJson = (json) => {
    try {
        return JSON.parse(json)
    } catch (e) {
        console.error(`couldn't parse ${json} - caused ${e}`);
        return null;
    }
}

var ybFoundLS = localStorage.getItem('ybFound')
var botMessages = (window.ybState || {}).botMessages ||
(localStorage.getItem('botMessages') ? tryParseJson(localStorage.getItem('botMessages')) : null) || {};


var oldState = window.ybState || {};
window.ybState = { ...{
    searchNames : [],
    searchRegExp: [],
    searchMessagesInRoom: [],
    nextIndex: 0,
    foundNames: ybFoundLS ? JSON.parse(ybFoundLS).map(a => ({ ...a, at: new Date(a.at)})) : [],
    botMessages,
    hideIDs: {},
debug:false,
stopTimedSend: {}, // signal to stop sending a story
}, ...oldState };
window.ybFuncs = {  
    xpath: function (str) {
        var res = new Array();iterator=document.evaluate(str, document, null,XPathResult.ANY_TYPE, null);var thisNode = iterator.iterateNext();while (thisNode) {res.push(thisNode);thisNode = iterator.iterateNext();}return res;
    },

    searchInRoomMessages: function (text) {
        return this.xpath('//div[@class="message-item"]//span[contains(text(),"' + text + '")]');
    },

    doSearchRoomMessages: function() {
        let msgs = ybState.searchMessagesInRoom;
        for (let i = 0; i < msgs.length; i++) {
            if (this.searchInRoomMessages(msgs[i]).length){
                this.found(msgs[i], [{ID: 0, NickName: msgs[i]}]);
            }
        }
    },

    getAllUser: function() {
        var ls = window.localStorage, items = {}, arr = [];
        for (var i = 0, k; i < ls.length; ++i) {
        //items[k = ls.key(i)] = JSON.parse(ls.getItem(k));
        let k = ls.key(i);
        if (k === 'botMessages') continue;
        try {
            var o = JSON.parse(ls.getItem(k));
            arr.push(Object.assign({ID: k, Mobile: !o.webRTC}, o));
        } catch (e) {
            console.error('problem with ', k, ls.getItem(k))
        }
        }
        return arr;        
    },

    getUser: function(id) {
        return this.getAllUser().find(u => u.ID == id);
    },

    sendNotification: function(title, body) {
        //if you want to enable push - uncomment that below
        //jQuery.get('https://127.0.0.1:8000/?action=onlineAlert&who='+ encodeURIComponent(title) + '&detail=' + encodeURIComponent(body));
        /*
        for (let i = 0; i < 4; i++) {
            setTimeout(() => playAudio(true), (i+1) * 60000)
        }
        */
        playAudio(true)
    },

    log: function() {
        if (!ybState.hideConsole) console.log(...arguments);
    },

    hideLogs: function(hide) {  
        ybState.hideConsole = hide;
    },

    didAlreadyFind: function(newFound) {
        if (!Array.isArray(newFound)) 
            newFound = [newFound];
            
        const id1 = newFound[0].ID; //search by 1 found only :( 
        return ybState.foundNames.find(f => f.IDs?.includes(id1));
    },

    found: function(term, found)
    {
        playAudio(true);
        ybState.foundNames.push({ at: new Date(), found: found, term: term, IDs: found?.map(f => f.ID) });
        localStorage.setItem('ybFound', JSON.stringify(ybState.foundNames));
        /* 
        * before I used to remove the search - now I keep it and check the ID if we already found
        var indx = ybState.searchNames.indexOf(term);
        if (indx > -1) ybState.searchNames.splice(indx, 1);
        */

        if (!$("#ybFound").length) {
            var foundHtml =
`
<ul id="ybFound" style="
    background: yellow;
    color: red;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 9999999999999;
margin: 13px;

">
<li onclick="ybFuncs.addAllFound(this)" id="yb-reload-all">reload all</li>
</ul>
`;
            $('body').append(foundHtml);
        }
        var at = new Date();
        var { names, liHtml } = ybFuncs.foundUserAsLI_html(at, found, term);
    
        ybFuncs.sendNotification(term, names.reduce((a,b) => a + "\n" + b));
        $("#ybFound").append(liHtml);
    },

    findWomenToSendMessage: function(age) {
        age = age || 24;
        let arr = ybFuncs.getAllUser().filter(u => u.Age <= age && !u.Man).
            sort((u1,u2) => u1.Age - u2.Age)

        console.log(arr.map(u => `${u.ID}-${u.NickName}(${u.Age}) ${(u.MoreAboutMe || "")}`).
            reduce((a,b) => a + "\n" + b))
    
        // find first 30 which haven't got any bot msg yet
        let sendTo = [];
        for (let i = 0; i < arr.length && sendTo.length < 40; i++) {
            const ignored = ['טרנסית', 'בת 12', 'הילה18', 'מתלבשת']
            const ignoreNames = ['...']
            const skip = 
                !arr[i] ||
                ybState.botMessages[arr[i].ID] || // already sent
                ignored.some(x => ybFuncs.serUser(arr[i]).indexOf(x) >= 0) || // bad ignored serialization
                ignoreNames.some(n => n === arr[i]); // bad name

            if (!skip) sendTo.push(arr[i]);
        }
    
        console.log('*********** all ***', arr.length)
    
    
        console.log('*********** sending to', sendTo.length)
        console.log(sendTo.map(u => `${u.ID}-${u.NickName}(${u.Age}) ${(u.MoreAboutMe || "")}`).
            reduce((a,b) => a + "\n" + b))

        return sendTo;
    },

    addAllFound: function(li) {
        if (ybState.foundNames) {
            //debugger
            $(li).siblings().remove();
            for (const foundName of ybState.foundNames) {
                const { at, found, term } = foundName;
                var { liHtml } = ybFuncs.foundUserAsLI_html(at, found, term);
                $("#ybFound").append(liHtml);
            }
        }
    },

    hideFound: function(id) {
        ybState.hideIDs = ybState.hideIDs || {};
        ybState.hideIDs[id] = true;
        // reload all 
        setTimeout(() => $('#yb-reload-all').click(), 100);
    },
    
    foundUserAsLI_html: function(at, found, term) {
        var ds = at.getHours() + ":" + at.getMinutes() + ":" + at.getSeconds();
        let foundUsers = found.map(x => Object.assign({ ID: x.ID }, Tools.Storage.getJSONObject(x.ID))).
            filter(x => !ybState.hideIDs || !ybState.hideIDs[x.ID]); // only those who aren't hidden
        let names = foundUsers.map(x => x.NickName);
        if (foundUsers.length == 0) return { liHtml :[], names: []}
        let asHtml = foundUsers.map(x => 
            `<div style="float: right;" onclick="ybFuncs.hideFound(${x.ID})">x &nbsp;&nbsp;</div>` +
            "<a class='tooltip' onclick='ybFuncs.userClicked(" + x.ID + ")'>(" + x.Age + ")" + (x.Man ? "M " : "F ") + x.NickName + 
            "<span class='tooltiptext'>" +  ybFuncs.serUser(x) + "</span></a>"
        );
        var usersHtml = asHtml.reduce((a, b) => a + "<br/>\n" + b);
        const liHtml = `<li>${ds}- ${term} <p>${usersHtml}</p></li>`;
        return { names, liHtml };
    },

    clearFound: function() {
        ybState.foundNames = [];
        ybFuncs.addAllFound();
    },

    userClicked: function(id) {
        GUI.Users.ActiveAddPrivateWindow(id);
        GUI.Users.ActivateAddTab(id);
    },

    sendMessageToUser: function(id, msg) {
        ybState.botMessages[id] = msg;
        localStorage.setItem('botMessages', JSON.stringify(ybState.botMessages));
        let t = Service.fixRow();
        Service.MessageToUser(msg, id, t);
    },

    sendMessageToUserNoHide: function(id, msg) {
        //ybState.botMessages[id] = msg;
        let t = Service.fixRow();
        //Service.MessageToUser(msg, id, t);
        let n = msg;
        let i = t;
        t = id;

        var r = {
            message: n,
            ReceiverID: t,
            miniMessage: i
        };
        Me.TextColorID != null && (r.ColorID = Me.TextColorID),
        $.ajax({
            url: chatCore.ServiceUrl + "/MessageToUser",
            data: r,
            type: "POST",
            success: function(n) {
                //Handlers.ServiceHandler.MessageToUser(n)
                console.log('sent a message')
            },
            error: function(n) {
                alert("There was an error posting the data to the server: " + n.responseText)
            }
        })
    },


    search: function(term) {
        if (!term) {
            console.error('missing search term');
            return;
        }
        if (ybState.searchNames.indexOf(term) >= 0)
        {
            console.error("already searching for "+  term);
            return;
        }
        window.ybState.searchNames.push(term);
        ybFuncs.startSearchInterval();
    },

    startSearchInterval: function() {
        if (window.ybState.searchInterval) return;
        // every 10 seconds - search
        window.ybState.searchInterval = setInterval(() => window.ybFuncs.doSearch(), 10000);
        // start the first one now
        ybFuncs.doSearch();        
    },

    clearSearch: function() {
        clearInterval(ybState.searchInterval);
        ybState.searchNames = [];
        ybState.searchRegExp = [];
        ybState.searchMessagesInRoom = [];
        ybState.searchInterval = 0;
    },

    searchRegExp(regExp) {
        let regExps = ybState.searchRegExp;

        if (!regExp) {
            console.error('missing search term');
            return;
        }
        if (regExps.indexOf(regExp) >= 0)
        {
            console.error("already searching for "+  regExp);
            return;
        }
        regExps.push(regExp);
        ybFuncs.startSearchInterval();        
    },    

    doSearch: function() {
        if (ybState.searchNames.length == 0 && ybState.searchRegExp.length == 0 && ybState.searchMessagesInRoom.length == 0) {
            ybFuncs.clearSearch();
            return;
        }
    
        if (ybState.searchNames.length > 0) {
            ybState.lastSearch = window.ybState.lastSearch || {};
            ybState.nextIndex++;
            if (ybState.nextIndex >= ybState.searchNames.length) ybState.nextIndex = 0;
            var term = ybState.searchNames[ybState.nextIndex];
        
            if (!term) return;
        
            Object.assign(ybState.lastSearch, { searchText: term});
            // search for user
            var data = ybState.lastSearch;
            var url = 'https://totalchat.co.il/Service/Search';

            jQuery.post(url, data, function(d) {console.log(d)} );
        }
        if (ybState.searchRegExp.length > 0) {
            ybFuncs.doSearchRegExp();
        }
        if (ybState.searchMessagesInRoom.length > 0) ybFuncs.doSearchRoomMessages();
    },

    doSearchRegExp() {
        // male,28,mobile/web,name,desc
        let users = ybFuncs.getAllUser()

        let newMatched = {};

        // we're no longer removing search - just checking by ID if found already 
        //let foundRegExp = [];
        for (let i = 0; i < ybState.searchRegExp.length; i++) {
            var re = new RegExp(ybState.searchRegExp[i]);
            let matched = users.filter(u => ybFuncs.serUser(u).match(re));
            for (let j = 0; j < matched.length; j++) {
                if (this.didAlreadyFind(matched[j])) {
                    this.log(`already found `, matched[j])
                    continue;
                }


                matched[j].regExp = ybState.searchRegExp[i];
                newMatched[matched[j].ID] = matched[j];
                // we're no longer removing search - just checking by ID if found already 
                //foundRegExp.push(matched[j].regExp);
            }
        }

        // we're no longer removing search - just checking by ID if found already 
        /*
        for (let i = 0; i < foundRegExp.length; i++) {
            let indx = ybState.searchRegExp.indexOf(foundRegExp[i]);
            if (indx > -1)
                ybState.searchRegExp.splice(indx, 1);            
        }
        */
        for (let id in newMatched) {
            let m = newMatched[id];
            ybFuncs.found(m.regExp, [m]);
        }        
    },

    serUser: (u) => {
        const areas = {
        '9': 'חו"ל',
        '8': 'אילת',
        '7': 'ב"ש והדרום',
        '6':'צפון',
        '5': 'חיפה',
        '4': 'ירושליים',
        '3': 'שפלה',
        '2': 'שרון',
        '1': 'מרכז',
        };

        return (u.Man?'male':'female') +"," +
                u.Age +"," +
                areas[u.Area] +","+
                (u.webRTC?'mobile':'web') + "," +
                u.NickName +"," + u.MoreAboutMe;
    },

    sendTimed: function (arr) {
        let uId = Me.ActiveWindowID;
        window.ybState.stopTimedSend[uId] = false;
        let f = (i) => {
            if (window.ybState.stopTimedSend[uId]) {
                console.log('stopped sending to ', uId);
                return;
            }
            //console.log(new Date(), arr[i]);
            ybFuncs.sendMessageToUserNoHide(uId, arr[i]);
            if (i + 1 < arr.length)
                setTimeout(() => f(i+1), arr[i+1].length * 250);
        };
        f(0);
    },

    stopSendTimed: function() {
        let uId = Me.ActiveWindowID;
        window.ybState.stopTimedSend[uId] = true;
        console.log('stopping sending to ', uId);
    }, 
}

if (!window.oldOpen) {
    window.oldOpen=window.open;window.open=function(){console.log('no-pop-ups-thanks')}; // disable popups alltogether
}
if (!window.oldLogin) {
window.oldLogin = Handlers.GUIHanlder.LoginClick;
}
// hide the stupid message
$('#insert-code #start-popup-submit').click()
Handlers.GUIHanlder.LoginClick = () => {
    // also hide on login
    window.oldLogin();
    setTimeout(() => {
        console.log('hiding button')
        $('#insert-code #start-popup-submit').click()
    }, 2000);
}
Validator.Login.Validate = () => { return  { IsValid: !0}};
// allow any word
Validator.SendMessage.Validate= () => { return  { IsValid: !0}};

if (!Tools.Storage.oldgetJSONObject) {
    Tools.Storage.oldgetJSONObject = Tools.Storage.getJSONObject;
    Tools.Storage.getJSONObject = (n) => {
        var t = Tools.Storage.oldgetJSONObject(n);
        return t || { NickName: 'unknown-' + n };
    };
}

// hide incoming message coming from my bot
if (!GUI.Users.oldAppendMessage) GUI.Users.oldAppendMessage = GUI.Users.AppendMessage;

GUI.Users.AppendMessage = (n) => {
    const bots = [9999999, 9999998];
    if (bots.includes(n.UserID)) {
        console.log('ignoring bot message', n);
        return;
    }

    if (ybState.botMessages[n.ReceiverID] == n.Message)
        setTimeout(() => $("#tab-" + n.ReceiverID + " .tab-close").click(), 10);

    //console.log("GUI.Users.AppendMessage", n);
    GUI.Users.oldAppendMessage(n)
}


var ybNavigator =  {
    timeIt: async function(name, cb) {
        const start = new Date().getTime();
        const t = await cb();
        const end = new Date().getTime();
        ybFuncs.log('\n********** \n ' + name + ' ' + (end - start) + 'ms\n***********\n');
        return t;
    },
    

    getRooms: function() {        
        const listId = "#Room-List";
        var roomList = $.find(listId);
        if (roomList == null) return [];

        const rooms = $.find("#Room-List .Room-Item");
        return rooms;
    },

    gotoRoom: function(room, done, idx = 0) {
        const roomName = $(room).find('label').text();
        const currentRoom = $.find("#room-tab-name")[0];
        const curName = currentRoom.textContent;
        if (roomName === curName) {
            // switched to room - yay 
            if (done) done();
        } else {
            if (!idx) {
                // first time trying to reach the 
                ybFuncs.log(`going to room ${roomName}`);
                room.click();
            } 
            if (idx > 5) {
                ybFuncs.log(`couldn't go to room ${roomName}`);
                if (done) done()
            } else setTimeout(() => this.gotoRoom(room, done, idx+1), 300);
        }
    },

    visitRooms: function(rooms, idx, done) {
        if (!rooms) {
            rooms = this.getRooms();
            idx = 0 
        }
        if (rooms.length <= idx) return this.gotoRoom(rooms[0], done);
        this.gotoRoom(rooms[idx], () => setTimeout(() => this.visitRooms(rooms, idx+1, done), 200))
    },

    visitRoomAsync: async function() {
        return new Promise((resolve) => {
            this.visitRooms(null, null, resolve);
        });
    }
} 

var SpamHandler = {
    rotateTS: null,
    nextRoomMemory: {},
    roomMemory: {}, // a hash of user id to his messages

    init: function(cnt) {
        console.log(`init spam handler${cnt}`)
        if (cnt > 100) return 'no no';
        if (this != SpamHandler) return SpamHandler.init(cnt+1);

        if (!window.ybState) window.ybState = {};

        if (!window.oldAppendImage) window.oldAppendImage = GUI.Rooms.AppendImage;
        GUI.Rooms.AppendImage = (n) => this.appendImage(n);

        if (!window.oldNewRoomMessage) window.oldNewRoomMessage = Handlers.RoomHandler.NewMessage;
        Handlers.RoomHandler.NewMessage = (n) => this.newRoomMessage(n);

        if (!window.oldBotMessage) window.oldBotMessage = Handlers.RoomHandler.NewBotMessage;
        Handlers.RoomHandler.NewBotMessage = (n) => this.handleBotMessage(n);

        window.ybState.spammers = window.ybState.spammers || {};
    },

    handleBotMessage: function(n) {
        console.log('ignoring new bot message',n);
    },

    hideWarning:function() {$('#insert-code #start-popup-submit').click()},

    rotateMemory: function() {
        if (this.rotateTS ) {
        if (this.rotateTS +120*1000 < new Date().getTime()) {
        // we've rotated 120 or more seconds ago
        if (ybState.debug) console.log(new Date(), 'rotating memory...')
        this.roomMemory = this.nextRoomMemory;
        this.nextRoomMemory = {};
        this.rotateTS = new Date().getTime();
        }
        } else {
        // first time only
        this.rotateTS = new Date().getTime();
        }
    },

    appendImage: function(n) {
        if (ybState.debug) console.log(`appending image `, n)
        const {UserID, Message, UserNick, ImageUrl} = n;
        if (!this.handlePotentialSpam({ ...n, Message: ImageUrl })) return;

        return window.oldAppendImage(n);
    },

    newRoomMessage: function(n) {
        if (ybState.debug) console.log(`newRoomMessage `, n)
        if (!this.handlePotentialSpam(n)) return;
        return window.oldNewRoomMessage(n);
    },

    handlePotentialSpam(n) {
        if (ybState.debug) console.log(n);
        const {UserID, Message, UserNick} = n;
        if (ybState.spammers[UserID]) return false; // skip futher spam

        const storedMessage  = {UserID, Message, UserNick, At: new Date()};

        if (!this.roomMemory[UserID]) this.roomMemory[UserID] = [];
        this.roomMemory[UserID].push(storedMessage);

        if (!this.nextRoomMemory[UserID]) this.nextRoomMemory[UserID] = [];
        this.nextRoomMemory[UserID].push(storedMessage);

        if (this.spamDetected(this.roomMemory[UserID], n)) this.handleSpam(UserID, n);
        this.rotateMemory();
        return true;
    },

    handleSpam: function(userId, curMessage) {
        console.log(`spammer !!! ${userId}`, curMessage);
        ybState.spammers[userId] = true;
    },

    spamDetected: function(userMessages, curMessage) {
        // if the user sent the same 3 messages in a period of 10 seconds - its a spam!
        const periodSeconds = 30;
        const repeatingMessages = 3;
        const dtLastCountTime = new Date().getTime() - periodSeconds*1000;

        matching = userMessages.filter(m =>
            m.At && m.At.getTime() > dtLastCountTime && // newer than X seconds ago
            m.Message == curMessage.Message) // same message

        return matching.length >= repeatingMessages;
},
}
SpamHandler.init(1);


f = (go2Lobby) => {
    if (ybState.stopRooms) return console.log('stopping ...');

    console.log(new Date(), 'going to loby ?', go2Lobby)
    
    try {
        rs = ybNavigator.getRooms().map(r => ({ text: r.textContent, e: r}))
        lobby = rs[0]
        oldies = rs.find(r => r.text.startsWith('מבוגר'))
        console.log({lobby, oldies})
        if (go2Lobby) lobby.e .click()
        else oldies.e.click();
    } catch (err) {
        console.error(`couldn't move a room`, err)
    }
    setTimeout(() => f(!go2Lobby), 60*1000)
}

ybFuncs.hideLogs(1)
