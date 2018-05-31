$(document).ready(function(){
	
	"use strict";

    $(document).ajaxStart(function () {
        $('#loader').show();
    }).ajaxStop(function () {
        $('#loader').hide();
    }).ajaxError(function () {
        $('#loader').hide();
    });
	
	var salesforcehome = {
		folders : {},
		dashboards : [],
		home: true
	}
	
	function getfolders(selectedOrg){
		$.ajax({
			url: "/getfolders"
		}).done(function( response ) {
			//console.log(data);
			let folders = response.folders;
            let folLen = response.folders.length;
            for (let i = 0; i < folLen; i++) {
                let folder = folders[i];
                if (!('label' in folder)) {
                    folder['label'] = 'My Private App';
                }
                let fid = folder.id;
                if (!(fid in selectedOrg['folders'])) {
                    selectedOrg['folders'][fid] = folder;
                    selectedOrg['folders'][fid]['isSelected'] = false;
                }

                if (selectedOrg["home"] === true) {
                    let newRow = '<a class="dimension" folderid="' + fid + '" style="display:none">';
                    newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
                    newRow += '<label data-tooltip-on-truncation="true">' + folder.label + '</label>';
                    newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
                    newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
                    newRow += '</span></a>';
                    $('#sfAppsList').append(newRow);
                }
            }
			getdashboards(salesforcehome,'/services/data/v42.0/wave/dashboards');
		}).fail(function(err){
			console.log(err)
		});
	}
	getfolders(salesforcehome);
	
	function getdashboards(selectedOrg,url){
		let postdata = {};
		postdata['url'] = url
		$.ajax({
			url: "/getdashboards",
			type: 'post',
			data: postdata,
			dataType: 'json'
		}).done(function( response ) {
			let len = response.dashboards.length;
            if (len > 0) {
                for (let i = 0; i < len; i++) {
                    let folder = response.dashboards[i].folder;
                    let fid = folder.id;
                    if (!('label' in folder)) {
                        folder['label'] = 'My Private App';
                    }
                    $('#sfAppsList').find('a[folderid="' + fid + '"]').show();
                    response.dashboards[i]['isSelected'] = false;
                    if (!(fid in selectedOrg['folders'])) {
                        selectedOrg['folders'][fid] = folder;
                        selectedOrg['folders'][fid]['isSelected'] = false;
                        if (selectedOrg['home'] === true) {
                            let existingrowscount = $('#sfAppsList').find('a[folderid="' + fid + '"]');
                            if(existingrowscount.length === 0){
                                let newRow = '<a class="dimension" folderid="' + fid + '">';
                                newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
                                newRow += '<label data-tooltip-on-truncation="true">' + folder.label + '</label>';
                                newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
                                newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
                                newRow += '</span></a>';
                                $('#sfAppsList').append(newRow);
                            }                            
                        }
                    }
                    selectedOrg['dashboards'].push(response.dashboards[i]);
                    /*if (selectedOrg['home'] === true) {
                        getDashboardMetaData(selectedOrg, response.dashboards[i].url);
                    }*/
                }
            }
            if (response.nextPageUrl != null) {
                getdashboards(selectedOrg, response.nextPageUrl)
            }
		}).fail(function(err){
			console.log(err)
		});
	}
	
	
	// Click action for Application list to show dashboards list.
    $('#sfAppsList').on('click', 'a', function () {
        $('#page1').find('.sfDashboardsList .myInput').val('');

        $('#sfAppsList').find('a.selected').removeClass('selected');
        $(this).addClass('selected');
        $('#sfDashboardsList').empty();

        let fid = $(this).attr("folderid");
        let len = salesforcehome['dashboards'].length;
        for (let i = 0; i < len; i++) {
            let dashboard = salesforcehome['dashboards'][i];
            if (fid === dashboard.folder.id) {
                appendDashboardsToDashboardsList(dashboard);
            }
        }
    });
	
	
	 // Function to append dashboards to Dashboards list.
    function appendDashboardsToDashboardsList(dashboard) {
        let newRow = '';
        newRow += '<a class="dimension" dashboardid="' + dashboard.id + '" folderid="' + dashboard.folder.id + '">'
        if (dashboard['isSelected'] === true) {
            newRow += '<img style="cursor:pointer;position:relative;z-index:2;margin-left:10px;" src="images/analyticscc__TA_Label.png" width="15px" height="10px" id="TA_Label"/>';
            newRow += '<img style="cursor:pointer;position:relative;z-index:2;margin-left:10px;display:none" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px" id="DimensionLabel"/>';
        } else {
            newRow += '<img style="cursor:pointer;position:relative;z-index:2;margin-left:10px;display:none" src="images/analyticscc__TA_Label.png" width="15px" height="10px" id="TA_Label"/>';
            newRow += '<img style="cursor:pointer;position:relative;z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px" id="DimensionLabel"/>';
        }
        newRow += '<label data-tooltip-on-truncation="true">' + dashboard.label + '</label>'
        newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>'
        //newRow += '<svg class="icon">';
        //newRow += '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/analytics/wave/web/proto/icons/sprite.analytics.svg#chevronright"></use>';
        //newRow += '</svg>';
        newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
        newRow += '</span></a>'

        $('#sfDashboardsList').append(newRow);
    }

    // Click action for Dashboards list to select a dashboard.
    $('#sfDashboardsList').on('click', 'a', function () {
        let did = $(this).attr('dashboardid');
        appendSfDashboardToSelected(did);
    });

    // Function to append dashboard to selected dashboards list.
    function appendSfDashboardToSelected(did) {
        let obj = salesforcehome['dashboards'].find(o => o.id === did);
        if (obj['isSelected'] === false) {
            obj['isSelected'] = true;
            let newRow = '';
            newRow += '<a class="dimension" dashboardid="' + obj.id + '" folderid="' + obj.folder.id + '">'
            newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__Delete.png" title="Delete" width="26px" height="12px" />'
            newRow += '<label data-tooltip-on-truncation="true">' + obj.label + '</label>'
            newRow += '</a>'
            $("#sfSelectedDashboardsList").append(newRow);
            let folderid = obj.folder.id;
            salesforcehome['folders'][folderid]['isSelected'] = true;
            $("#sfDashboardsList").find("a[dashboardid='" + did + "'] img#TA_Label").show();
            $("#sfDashboardsList").find("a[dashboardid='" + did + "'] img#DimensionLabel").hide();
        }
    }

    // Function to select all dashboards on click.
    $('.sfDashboardsList').on('click', '#sfSelectAllDashboards', function () {
        $('#sfDashboardsList').find('a').click();
    });

    // Click action to Deselect a selected dashboard on click.
    $('#sfSelectedDashboardsList').on('click', 'a', function () {
        let dId = $(this).attr('dashboardid');
        let fId = $(this).attr('folderid');
        let folders = $('#sfSelectedDashboardsList').find("a[folderid='" + fId + "']");
        if (folders.length === 1) {
            salesforcehome['folders'][fId]['isSelected'] = false;
        }
        let obj = salesforcehome['dashboards'].find(o => o.id === dId);
        if (obj['isSelected'] === true) {
            obj['isSelected'] = false;
        }
        let rep = $('#sfDashboardsList').find('a[dashboardid="' + dId + '"]');
        rep.find("img#TA_Label").hide();
        rep.find("img#DimensionLabel").show();
        $(this).remove();
    });

    // Function to deselect all selected dashboards on click.
    $('.sfSelectedDashboardsList').on('click', '#sfDeSelectAllDashboards', function () {
        $('#sfSelectedDashboardsList').find('a').click();
    });
	
	
	function getnamespace(){
		$.ajax({
			url: "/getnamespace"
		}).done(function( data ) {
			console.log(data);
		}).fail(function(err){
			console.log(err)
		});
	}
	getnamespace();
	
	$('#button').on('click', function(){
		$.ajax({
			url: "/anotherorg"
		}).done(function( data ) {
			console.log(data);
		}).fail(function(err){
			console.log(err)
		});
	});
	
});