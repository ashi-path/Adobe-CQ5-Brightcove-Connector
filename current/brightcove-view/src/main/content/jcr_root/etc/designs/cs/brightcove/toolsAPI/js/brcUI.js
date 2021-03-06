/*


 Adobe CQ5 Brightcove Connector

 Copyright (C) 2011 Coresecure Inc.

 Authors:    Alessandro Bonfatti
 Yan Kisen

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.



 *//*vm_ui.js
*ui code
*/
//tUploadBar has the timer id for the upload progress bar, so it can be cancelled.  progressPos is used to keep track of the progress bar's position.
var tUploadBar
var progressPos = 0;
var searchVal;
var paging;

//called once body loads.  sets the api location and loads all videos
$(function()
{
    if($.browser.msie){
        //IE css opacity hack
        $("#screen").css("filter", "alpha(opacity = 65)")
            .css("zoom",1);
    }
    
    //Initialize the paging object
    //each member variable stores the current page
    //for different views in the console.
    //currentFunction calls the corresponding function
    //on a page change.
    paging = {  
        allVideos       :0,
        allPlaylists    :0,
        curPlaylist     :0,
        textSearch      :0,
        tagSearch       :0,
        generic         :0,     //used as a placeholder
        currentFunction :null,  //called when a page is changed
        size            :30     //Default Page Size [30], can be no larger than 100.  
    }
    
    Load(getAllVideosURL());
    var app = new CQ.Switcher({});
    app.render(document.body);
    app = new CQ.HomeLink({});
    app.render(document.body);
});

//function to move the progress bar on the video upload progress window
function uploadProgressBar(){
    progressPos += 10;
    document.getElementById("progress").style.left = (progressPos %80) + '%';
}
function switchSort(sortIn) {
	if ("DESC" == sortIn) {
		return "ASC";
    } else if ("ASC" == sortIn){
        return "DESC";
    } else {
		return "ASC";
    }
}
function sort(object) {
	if($(object).hasClass("ASC") || $(object).hasClass("DESC") || $(object).hasClass("NONE")) {
		var sortBy = $(object).attr("data-sortBy");
		var oldSortType = $(object).attr("data-sortType");
		var sortType = switchSort(oldSortType);
		$(".sortable", $(object).parent()).not($(object)).addClass("NONE");
	    $(object).toggleClass(oldSortType);
	    $(object).toggleClass(sortType);
	    $(object).removeClass("NONE");
	    $(object).attr("data-sortType",sortType);
	    Load(getAllVideosURLOrdered(sortBy, sortType));
	}
}
function buildMainVideoList(title) {
    
    //Wipe out the old results
    $("#tbData").empty();
    if(!$("#nameCol").hasClass("ASC") && !$("#nameCol").hasClass("DESC") && !$("#nameCol").hasClass("NONE")) {
	    $("#trHeader th.sortable").add("NONE");
	    $("#nameCol").addClass("ASC").attr("data-sortType","ASC");
    }
    // Display video count
    document.getElementById('divVideoCount').innerHTML = oCurrentVideoList.length + " videos";
    document.getElementById('nameCol').innerHTML = "Video Name<span class='order'></span>";
    document.getElementById('headTitle').innerHTML = title;
    document.getElementById('search').value = searchVal ? searchVal : "Search Videos";
    document.getElementById('tdMeta').style.display  = "block";
    document.getElementById('searchDiv').style.display  = "inline";
    document.getElementById('searchDiv_pl').style.display = "none";

    document.getElementById('checkToggle').style.display  = "inline";
    $("span[name=buttonRow]").show();
    $(":button[name=delFromPlstButton]").hide();
        
    
    //For each retrieved video, add a row to the table
    var modDate = new Date();
    $.each(oCurrentVideoList, function(i,n){
        modDate.setTime(n.lastModifiedDate);
        $("#tbData").append(
            "<tr style=\"cursor:pointer;\" id=\""+(i)+"\"> \
            <td>\
                <input type=\"checkbox\" value=\""+(n.id)+"\" id=\""+(i)+"\" onclick=\"checkCheck()\">\
            </td><td>"
                +n.name +
            "</td><td>"
                +(modDate.getMonth()+1)+"/"+modDate.getDate()+"/"+modDate.getFullYear()+"\
            </td><td>"
                +((n.referenceId)?n.referenceId:'')+
            "</td><td>"
                +n.id+
            "</td></tr>"
        ).children("tr").bind('click', function(){
            showMetaData(this.id);
        })
    });
    
    //Zebra stripe the table
    $("#tbData>tr:even").addClass("oddLine");
    
    //And add a hover effect
    $("#tbData>tr").hover(function(){
        $(this).addClass("hover");
    }, function(){
        $(this).removeClass("hover");
    });

    //if there are videos, show the metadata window, else hide it
    if(oCurrentVideoList.length > 0){showMetaData(0);}
    else{closeBox("tdMeta");}
}

function buildPlaylistList(){
    
    //Wipe out the old results
    $("#tbData").empty();
    $("#trHeader th.sortable").removeClass("NONE").removeClass("ASC").removeClass("DESC");

    // Display Playlist count
    document.getElementById('divVideoCount').innerHTML = oCurrentPlaylistList.length + " playlists";
    document.getElementById('nameCol').innerHTML = "Playlist Name";
    document.getElementById('headTitle').innerHTML = "All Playlists";
    document.getElementById('search_pl').value = "Search Playlists";
    document.getElementById('tdMeta').style.display = "none";
    document.getElementById('searchDiv').style.display = "none";
    document.getElementById('searchDiv_pl').style.display = "inline";
    document.getElementById('checkToggle').style.display = "none";
    $("span[name=buttonRow]").hide();
    $(":button[name=delFromPlstButton]").hide();
    
    
    //For each retrieved playlist, add a row to the table
    $.each(oCurrentPlaylistList, function(i,n){
        $("#tbData").append(
            "<tr style=\"cursor:pointer;\" id=\""+i+"\">\
            <td>\
            </td><td>"
                +n.name +
            "</td><td>\
                <center>---</center>\
            </td><td>"
                +((n.referenceId)?n.referenceId:'')+
            "</td><td>"
                +n.id+
            "</td></tr>"
        ).children("tr").bind('click', function(){
            getPlaylist(this.id);
        })
    });
    
    //Zebra stripe the table
    $("#tbData>tr:even").addClass("oddLine");
    
    //And add a hover effect
    $("#tbData>tr").hover(function(){
        $(this).addClass("hover");
    }, function(){
        $(this).removeClass("hover");
    });
    
}
function getPlaylist(idx){
    oCurrentPlaylistList = oCurrentPlaylistList[idx];
    paging.currentFunction = createSubPlaylist;
    changePage(0);
}

function createSubPlaylist(){
    if(oCurrentPlaylistList.videos.length > paging.size){
        paging.curPlaylist = paging.generic;
        oCurrentVideoList = new Array();
        var i = paging.curPlaylist*paging.size;
        var lim = (paging.curPlaylist+1)*paging.size>oCurrentPlaylistList.videos.length ?
                    oCurrentPlaylistList.videos.length:
                    (paging.curPlaylist+1)*paging.size;
        for(; i < lim; i++){
            oCurrentVideoList.push(oCurrentPlaylistList.videos[i]);
        }
    }else{
        oCurrentVideoList = oCurrentPlaylistList.videos;
    }
    
    showPlaylist();
    doPageList(oCurrentPlaylistList.videos.length, "Videos");
    paging.generic = paging.allVideos;
}

function showPlaylist(){
    //Wipe out the old results
    $("#tbData").empty();
    
    document.getElementById('divVideoCount').innerHTML = oCurrentVideoList.length + " videos";
    //$("#divVideoCount").html(oCurrentVideoList.length + " videos");
    document.getElementById('nameCol').innerHTML = "Video Name";
    document.getElementById('headTitle').innerHTML = oCurrentPlaylistList.name;
    document.getElementById('search').value = "Search Videos";
    document.getElementById('searchDiv').style.display = "inline"
    document.getElementById('searchDiv_pl').style.display = "none";

    document.getElementById('checkToggle').style.display = "inline"
    document.getElementById('tdMeta').style.display = "block";
    $("span[name=buttonRow]").show();
    $(".uplButton").hide();
    $(".delButton").hide();
    $(":button[name=delFromPlstButton]").show();
    
    //For each retrieved video, add a row to the table
    modDate = new Date();
    $.each(oCurrentVideoList, function(i,n){        
        modDate.setTime(n.lastModifiedDate);
        $("#tbData").append(
            "<tr style=\"cursor:pointer\" id=\""+(i)+"\"> \
            <td>\
                <input type=\"checkbox\" value=\""+(i)+"\" id=\""+(i)+"\" onclick=\"checkCheck()\">\
            </td><td>"
                +n.name+
            "</td><td>"
                +(modDate.getMonth()+1)+"/"+modDate.getDate()+"/"+modDate.getFullYear()+"\
            </td><td>"
                +((n.referenceId)?n.referenceId:'')+
            "</td><td>"
                +n.id+
            "</td></tr>"
        ).children("tr").bind('click', function(){
            showMetaData(this.id);
        });
    });
    
    //Zebra stripe the table
    $("#tbData>tr:even").addClass("oddLine");
    
    //And add a hover effect
    $("#tbData>tr").hover(function(){
        $(this).addClass("hover");
    }, function(){
        $(this).removeClass("hover");
    });
    
    if(oCurrentVideoList.length >0){showMetaData(0);}
    else{closeBox("tdMeta");}

}

function showMetaData(idx) {
    $("tr.select").removeClass("select");
    $("#tbData>tr:eq("+idx+")").addClass("select");
    
    var v = oCurrentVideoList[idx];
    
    // Populate the metadata panel
    document.getElementById('divMeta.name').innerHTML = v.name;
    document.getElementById('divMeta.thumbnailURL').src = v.thumbnailURL;
    document.getElementById('divMeta.videoStillURL').src = v.videoStillURL;
    document.getElementById('divMeta.previewDiv').value = v.id; 
    var modDate = new Date();
    modDate.setTime(v.lastModifiedDate);
    document.getElementById('divMeta.lastModifiedDate').innerHTML = (modDate.getMonth()+1)+"/"+modDate.getDate()+"/"+modDate.getFullYear();
    
    //v.length is the running time of the video in ms
    var sec = String((Math.floor(v.length*.001))%60); //The number of seconds not part of a whole minute
    sec.length < 2 ? sec = sec + "0" : sec;  //Make sure  the one's place 0 is included. 
    document.getElementById('divMeta.length').innerHTML = Math.floor(v.length/60000) + ":" + sec;
    
    document.getElementById('divMeta.id').innerHTML = v.id;
    document.getElementById('divMeta.shortDescription').innerHTML = "<pre>"+v.shortDescription+"</pre>";
    
    //Construct the tag section:
    var tagsObject = "";
    if("" != v.tags){
        var tags = v.tags.toString().split(',');
        for(var k = 0; k < tags.length; k++){
            if(k>0){tagsObject += ', ';}
            tagsObject += '<a style="cursor:pointer;color:blue;text-decoration:underline"' + 
                'onclick="searchVal=\''+tags[k].replace(/\'/gi, "\\\'")+'\';Load(findByTag(\''+tags[k]+'\'))" >'+tags[k]+'</a>';
        }
    }       
    document.getElementById('divMeta.tags').innerHTML = tagsObject;
    
    //if there's no link text use the linkURL as the text
    if("" != v.linkText && null != v.linkText){
        document.getElementById('divMeta.linkURL').innerHTML = v.linkText;
    }else{
        document.getElementById('divMeta.linkURL').innerHTML = (v.linkURL==null)?"":v.linkURL;
    }
    document.getElementById('divMeta.linkURL').href = v.linkURL;
    document.getElementById('divMeta.linkText').innerHTML = v.linkText;
    document.getElementById('divMeta.economics').innerHTML = v.economics;
    
    modDate.setTime(v.publishedDate);
    document.getElementById('divMeta.publishedDate').innerHTML = (modDate.getMonth()+1)+"/"+modDate.getDate()+"/"+modDate.getFullYear();
    document.getElementById('divMeta.referenceId').innerHTML = (v.referenceId != null)?v.referenceId:"";
}

//open an overlay and show the screen
function openBox(id){
    $("#screen")
        .width($(document).width())
        .height($(document).height());
    
    $('#'+id)
        .css("left",($(window).width()/4))
        .css("top",($(window).height()/6))
        .draggable();
        
    if(!$.browser.msie){
        $("#screen, #"+id).fadeIn("fast");
    }else{
        $("#screen, #"+id).show();
    }
}

//close an open overlay and hide the screen, if a form is passed, reset it.
function closeBox(id, form){
    //Don't close the screen if another window is open
    var strSelect = '#'+id+(($("div.overlay:visible").length>1)?"":",#screen");
    if(!$.browser.msie){
        $(strSelect).fadeOut("fast");
    }else{
        $(strSelect).hide();
    }
    if(null != form){form.reset();}
}
CQ.Ext.brightcove = {};

CQ.Ext.brightcove.economics = new CQ.Ext.data.JsonStore({
	fields:['value','text'],                            
    data: [
            {value:'AD_SUPPORTED',text: 'Ad Enabled'},
            {value:'FREE',text: 'No Ads'}
        ]      
});

function extMetaEdit() {
	var v = oCurrentVideoList[$("tr.select").attr("id")];
	var modDate = new Date()
    modDate.setTime(v.lastModifiedDate);
	var sec = String((Math.floor(v.length*.001))%60); //The number of seconds not part of a whole minute
    sec.length < 2 ? sec = sec + "0" : sec;  //Make sure  the one's place 0 is included. 
    
	var tags = ((v.tags!= null)?v.tags:new Array());
	var combo = new CQ.Ext.form.ComboBox({
        store: CQ.Ext.brightcove.economics,
        fieldLabel: 'Economics:',
        displayField:'text',
        valueField:'value',
        mode: 'local',
        forceSelection: true,
        editable:false,
        width:"100%",
        hiddenName:"meta.economics",
        id:"meta.economics",
        triggerAction:"all",
        value:(v.economics != null)?v.economics:""
    });
	
	var form = new CQ.Ext.form.FormPanel({
		baseCls: 'x-plain',
	    labelWidth: 130,
	    url: apiLocation,
	    method:"POST",
	    standardSubmit: false,
	    defaults: {
	        xtype: 'textfield'
	    },
	    
	    items: [{
	        xtype: 'textfield',
	        fieldLabel: 'Title:',
	        id: 'meta.name',
	        name: 'meta.name',
	        value:v.name,
	        width:"100%",
	        allowBlank:false
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Last Updated:',
	        value: (modDate.getMonth()+1)+"/"+modDate.getDate()+"/"+modDate.getFullYear(),
	        disabled: true,
	        width:"100%"
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Date Published:',
	        value: (modDate.getMonth()+1)+"/"+modDate.getDate()+"/"+modDate.getFullYear(),
	        disabled: true,
	        width:"100%"
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Duration:',
	        value: Math.floor(v.length/60000) + ":" + sec,
	        disabled: true,
	        width:"100%"
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Video ID:',
	        value: v.id,
	        disabled: true,
	        width:"100%"
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Short Description:',
	        id: 'meta.shortDescription',
	        name: 'meta.shortDescription',
	        value:v.shortDescription,
	        width:"100%",
	        allowBlank:false
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Link to Related Item:',
	        id: 'meta.linkURL',
	        name: 'meta.linkURL',
	        value:(v.linkURL != null)?v.linkURL:"",
	        width:"100%"
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Text for Related Item:',
	        id: 'meta.linkText',
	        name: 'meta.linkText',
	        value:(v.linkText != null)?v.linkText:"",
	        width:"100%"
	    },{
	        xtype: 'tags',
	        fieldLabel: 'Tags:',
	        id: 'meta.tags',
	        name: 'meta.tags',
	        value: tags,
	        width:"100%"
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Reference ID:',
	        id: 'meta.referenceId',
	        name: 'meta.referenceId',
	        value:(v.referenceId != null)?v.referenceId:"",
	        width:"100%"
	    },combo,{
	        xtype: 'hidden',
	        id: 'meta.id',
	        name: 'meta.id',
	        value: v.id,
	        width:"100%"
	    },{
	        xtype: 'hidden',
	        id: 'command',
	        name: 'command',
	        value:'update_video',
	        width:"100%"
	    },{
	        xtype: 'hidden',
	        id: 'meta.existingTags',
	        name: 'meta.existingTags',
	        value:tags.join(),
	        width:"100%"
	    }]
	});
	
	var w = new CQ.Ext.Window({
	    title: 'Update Video',
	    collapsible: true,
	    maximizable: true,
	    width: 750,
	    height: 500,
	    minWidth: 300,
	    minHeight: 200,
	    bodyStyle: 'padding:5px;',
	    buttonAlign: 'center',
	    items: form,
	    buttons: [{
	        text: 'Send',
	        handler: function (btn, evt) { 
	    		var formobj = form.getForm();
	    		if(formobj.isValid()) {
	    			formobj.submit({
	                    success: function (form, action) {
	                        w.destroy();
	                    },
	                    failure: function (form, action) {
	                    	 CQ.Ext.Msg.alert('Submission Failed', action.result && action.result.msg != "" ? action.result.msg : 'ERROR: Please try again.');
	                    }
	                });
	    		    loadStart();
	    		    Load(getAllVideosURL());

	            }
	            else alert('Invalid form');
	        }
	    },{
	        text: 'Cancel',
	        handler: function (btn, evt) { w.destroy() }
	    }]
	});
	w.setPosition(10,10);
	w.show();

}

function metaEdit(){
    var v = oCurrentVideoList[$("tr.select").attr("id")];
    
    document.getElementById('meta.name').value = v.name;
    var modDate = new Date()
    modDate.setTime(v.lastModifiedDate);
    document.getElementById('meta.lastModifiedDate').innerHTML = (modDate.getMonth()+1)+"/"+modDate.getDate()+"/"+modDate.getFullYear();

    //v.length is the running time of the video in ms
    var sec = String((Math.floor(v.length*.001))%60); //The number of seconds not part of a whole minute
    sec.length < 2 ? sec = sec + "0" : sec;  //Make sure  the one's place 0 is included. 
    
    document.getElementById('meta.preview').value = document.getElementById('divMeta.previewDiv').value;
    document.getElementById('meta.length').innerHTML = Math.floor(v.length/60000) + ":" + sec;
    document.getElementById('tdmeta.id').innerHTML = v.id;
    document.getElementById('meta.id').value = v.id;
    document.getElementById('meta.shortDescription').value = v.shortDescription;
    document.getElementById('meta.tags').value= (v.tags!= null)?v.tags:"";
    document.getElementById('meta.linkURL').value= (v.linkURL != null)?v.linkURL:"";
    document.getElementById('meta.linkText').value= (v.linkText != null)?v.linkText:"";
    document.getElementById('meta.economics').value= (v.economics != null)?v.economics:"";
    
    modDate.setTime(v.publishedDate);
    document.getElementById('meta.publishedDate').innerHTML = (modDate.getMonth()+1)+"/"+modDate.getDate()+"/"+modDate.getFullYear();
    document.getElementById('meta.referenceId').value = (v.referenceId != null)?v.referenceId:"";
    
    openBox('metaEditPop');
}

//Alerts the user that communication is happening, useful for accounts with lots of videos
//where loading times might be a little long.
function loadStart(){
    if(!$.browser.msie){
        $("#loading").slideDown("fast");
    }else{
        $("#loading").show();
    }
}

function loadEnd(){
    if(!$.browser.msie){
        $("#loading").slideUp("fast");
    }else{
        $("#loading").hide();
    }
}

function createPlaylistBox(){
    var inputTags = document.getElementById('listTable').getElementsByTagName('input');
    var form = document.getElementById('createPlaylistForm');
    var table = document.getElementById("createPlstVideoTable");
    var idx = 1;
    
    form.playlist.value = '';
    var l = inputTags.length
    for(var i = 2; i < l; i++){
        if(inputTags[i].checked){
            $("#createPlstVideoTable").append(
                '<tr ><td>'+oCurrentVideoList[i-2].name+
                '</td><td>'+oCurrentVideoList[i-2].id+'</td></tr>'
            )
            
            if(1 != idx){form.playlist.value += ',';}
            form.playlist.value += oCurrentVideoList[i-2].id;
            idx++;
        }
    }
    if(1 == idx){alert("Cannot Create Empty Playlist, Please Select Some Videos");return;}
    openBox("createPlaylistDiv");
}

/*show a preview of the selected video 
* this works by embedding an iframe into an existing hidden div.
* the iframe opens the brightcove player and passes the requested videoId.  
*In console 1, click players, get publishing code.  Copy the Player URL
* and assign it to the variable previewPlayerLoc at the top of this document.
* In the publishing module click get code and select Player URL.
*/
function doPreview(id){
    document.getElementById("playerTitle").innerHTML =  "<center>"+document.getElementById("divMeta.name").innerHTML+"</center>";
    var preview = document.createElement('iframe');
    //if ($("a#allVideos").parent("li").attr("class").indexOf("active") != -1){
        preview.setAttribute("src", previewPlayerLoc+"?bctid="+id);
        preview.setAttribute("width", 480);
        preview.setAttribute("height", 270);    
    /*} else {
        preview.setAttribute("src", previewPlayerListLoc+"?bctid="+id);
        preview.setAttribute("width", 960);
        preview.setAttribute("height", 445);
    }*/
    preview.setAttribute("frameborder", 0);
    preview.setAttribute("scrolling", "no");
    preview.setAttribute("id", "previewPlayer");
    document.getElementById("playerDiv").appendChild(preview);

    //This div has a close button, more content can be added  here below the player.  to add content above the player add it to the
    //playerDiv in default.html
    $("#playerDiv").append('<div id="previewClose" style="background-color:#fff;color:#5F9CE3;cursor:pointer; text-transform:uppercase; font-weight:bold;"\
    onclick="stopPreview()"><br/><center>Close Preview</center></div>');
    openBox("playerDiv");
 
}

/**
could probably improve preview performance by loading the preview player with no video, then on doPreview using the playerapi to load the video
that way player is kepy resident which cuts down on loading time.
**/

function changeImage(id){
	$("#uploadImageDiv #videoidthumb").val(id);
	openBox('uploadImageDiv');
    
 
}
function changeVideoImage(id){
	$("#uploadVideoImageDiv #videoidthumb").val(id);
	openBox('uploadVideoImageDiv');
    
 
}
//before closing the player window, remove the created elements, otherwise they would persist into another preview window.
function stopPreview(){
    document.getElementById("playerDiv").removeChild(document.getElementById("previewPlayer"));
    document.getElementById("playerDiv").removeChild(document.getElementById("previewClose"));
    closeBox('playerDiv');
}

//type should be playlists or videos
function doPageList(total, type){
    if(total > paging.size){
        var numOpt = Math.ceil(total / paging.size);
        var select = document.getElementsByName("selPageN");
        var options = "";
        for(var i = 0; i < numOpt; i++){
            options += '<option style="width:100%" id="'+i+'">';
            if(paging.generic == i){
                num = (numOpt-1 == i)?(total - i*paging.size):paging.size;
                document.getElementById('divVideoCount').innerHTML = num + ' '+ type + ' (of ' + total + ')';
            }
            if(numOpt-1 == i){
                options += 'Page '+i+' ('+type+' '+(i*paging.size+1)+' to '+ total +' )</option>';
            }else{
                options += 'Page '+i+' ('+type+' '+(i*paging.size+1)+' to '+((i+1)*paging.size)+' )</option>';
            }
        }
        //remove previous options, add the new ones and select the current page in the option list
        $("select[name=selPageN]").empty().append(options).children("[id="+paging.generic+"]").each(function(){
            //need to try/catch for IE6
            try{
                this.selected = true;
            }catch(e){}
        });
        $("div[name=pageDiv]").show();
        document.getElementById('tdOne').appendChild(document.getElementById('searchDiv'));
    }else{
        document.getElementById('divVideoCount').innerHTML = total + ' '+ type + ' (of ' + total + ' )';
        $("div[name=pageDiv]").hide();
        //If there's no page selector, move the search bar down so it doesn't stick out ofplace
        document.getElementById('tdTwo').appendChild(document.getElementById('searchDiv'));
    }
}

function changePage(num){
    paging.generic = num;
    Load(paging.currentFunction());
}

function checkCheck(){
    var count = 1;
    var inputTags = document.getElementById('listTable').getElementsByTagName('input');
    var selChek = document.getElementById('checkToggle');
    var l = inputTags.length
    for(var i = 2; i < l ; i++){
        if(true == inputTags[i].checked){ 
            count++; 
        }else if ((i - count) > 1){//If one checkbox was skipped, then the total has to be < l, so uncheck selChek  and return.
            selChek.checked = false;
            return;
        }
    }
    if(selChek.checked == true && count < l){
        selChek.checked = false;
    }else if (false == selChek.checked && count >= l-1){
        selChek.checked = true;
    }
}

function toggleSelect(check){
    if(check.checked){
        checkAll();
    }else{
        checkNone();
    }
}

function checkAll(){
    var inputTags = document.getElementById('listTable').getElementsByTagName('input');
    var l = inputTags.length;
    for(var i = 2; i < l; i++){
        inputTags[i].checked = true;
    }
}

function checkNone(){
    var inputTags = document.getElementById('listTable').getElementsByTagName('input');
    var l = inputTags.length;
    for(var i = 2; i < l; i++){
        inputTags[i].checked = false;
    }
}

//for example write functions are disabled, so display this message:
function noWrite(){
    alert("In this demo, write methods have been disabled.");
}

function extFormUpload() {

	var form = new CQ.Ext.form.FormPanel({
		baseCls: 'x-plain',
	    labelWidth: 130,
	    url: apiLocation,
	    method:"POST",
	    standardSubmit: false,
	    defaults: {
	        xtype: 'textfield'
	    },
	    
	    items: [{
	        xtype: 'textfield',
	        fieldLabel: 'Title:',
	        id: 'name',
	        name: 'name',
	        width:"100%",
	        allowBlank:false
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Short Description:',
	        id: 'shortDescription',
	        name: 'shortDescription',
	        width:"100%",
	        allowBlank:false
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Link to Related Item:',
	        id: 'linkURL',
	        name: 'linkURL',
	        width:"100%"
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Text for Related Item:',
	        id: 'linkText',
	        name: 'linkText',
	        width:"100%"
	    },{
	        xtype: 'tags',
	        fieldLabel: 'Tags:',
	        id: 'tags',
	        name: 'tags',
	        width:"100%"
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Reference ID:',
	        id: 'referenceId',
	        name: 'referenceId',
	        width:"100%"
	    },{
	        xtype: 'textfield',
	        fieldLabel: 'Long Description:',
	        id: 'longDescription',
	        name: 'longDescription',
	        width:"100%"
	    },{
	        xtype: 'fileuploadfield',
	        id: 'filePath',
	        emptyText: 'Select a video',
	        fieldLabel: 'Video',
	        name: 'filePath',
	        buttonText: 'Browse',
	        width:"100%",
	        allowBlank:false
	    },{
	        xtype: 'hidden',
	        id: 'video',
	        name: 'video',
	        value:'',
	        width:"100%"
	    },{
	        xtype: 'hidden',
	        id: 'command',
	        name: 'command',
	        value:'create_video',
	        width:"100%"
	    }]
	});
	
	var w = new CQ.Ext.Window({
	    title: 'Compose message',
	    collapsible: true,
	    maximizable: true,
	    width: 750,
	    height: 500,
	    minWidth: 300,
	    minHeight: 200,
	    bodyStyle: 'padding:5px;',
	    buttonAlign: 'center',
	    items: form,
	    buttons: [{
	        text: 'Send',
	        handler: function (btn, evt) { 
	    		var formobj = form.getForm();
	    		if(formobj.isValid()) {
	    			var formel = document.getElementById(formobj.getEl().id);
	    		    buildJSONRequest(formel);
	    		    //Ext.getCmp('form').getForm().submit();
	    			formobj.submit({
	                    success: function (form, action) {
	                        w.destroy();
	                    },
	                    failure: function (form, action) {
	                    	 CQ.Ext.Msg.alert('Submission Failed', action.result && action.result.msg != "" ? action.result.msg : 'ERROR: Please try again.');
	                    }
	                });
	    		    loadStart();
	    		    Load(getAllVideosURL());
	    		    //w.destroy();
	            }
	            else alert('Invalid form');
	        }
	    },{
	        text: 'Cancel',
	        handler: function (btn, evt) { w.destroy() }
	    }]
	});
	w.setPosition(10,10);
	w.show();

}