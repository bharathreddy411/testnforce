$(document).ready(function () {

    "use strict";

    $(document).ajaxStart(function () {
        $('#loader').show();
    }).ajaxStop(function () {
        $('#loader').hide();
    }).ajaxError(function () {
        $('#loader').hide();
    });

    var currentPage = 1;

    function salesforce() {
        var self = this;
        self.orgname;
        self.home = false;
        self.loggedIn = false;
        self.session = '';
        self.folders = {};
        self.dashboards = [];
        self.dashboardsMetaData = {};
        self.namespaceprefix = '';
        self.datasets = {};
        self.images = [];
        self.userinfo;
        self.sobjects = [];
        self.dataflows = [];
    }

    // Create new instance of salesforce for current org
    var salesforcehome = new salesforce();
    salesforcehome.home = true;

    function getfolders(selectedOrg) {
        $.ajax({
            url: "/getfolders"
        }).done(function (response) {
            var folders = response.folders;
            var folLen = response.folders.length;
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
            getdashboards(salesforcehome, '/services/data/v42.0/wave/dashboards');
        }).fail(function (err) {
            console.log(err)
        });
    }
    getfolders(salesforcehome);

    function getidentity(selectedOrg) {
        $.ajax({
            url: '/getidentity',
        }).done(function (response) {
            selectedOrg['userinfo'] = response;
        }).fail(function (err) {
            console.log(err)
        });
    }
    getidentity(salesforcehome);

    //function to get all salesforce datasets by org
    function getAllDatasets(selectedOrg, url) {
        var postdata = {};
        postdata.url = url;
        $.ajax({
            dataType: 'json',
            url: 'getalldatasets',
            type: 'POST',
            data: postdata
        }).done(function (response) {
            let datasets = response.datasets;
            let len = datasets.length;
            for (let i = 0; i < len; i++) {
                if (!(datasets[i].id in selectedOrg.datasets)) {
                    selectedOrg.datasets[datasets[i].id] = datasets[i];
                }
            }
            if (response.nextPageUrl != null) {
                getAllDatasets(selectedOrg, response.nextPageUrl);
            }
        }).fail(function () {
            console.log("error");
        });
    }
    getAllDatasets(salesforcehome, '/services/data/v42.0/wave/datasets');

    // Function to get All images list from salesforce to show as dd in accordion
    function getImagesFromSalesForce(selectedOrg) {
        let query = "SELECT+Title+FROM+ContentDocument+WHERE+FileType+IN+('PNG','JPG')+AND+IsDeleted+=+false";
        let postdata= {};
        postdata.query = query;
        $.ajax({
            url: '/getsavedconfigs',
            type: 'POST',
            data: postdata
        }).done(function (response) {
            selectedOrg['images'] = response.records;
        }).fail(function (err) {
            console.log(err)
        });
    }
    getImagesFromSalesForce(salesforcehome);

    function getDataflows(selectedOrg) {
        $.ajax({
            url: "/dataflows"
        }).done(function (response) {
            selectedOrg['dataflows'] = response.dataflows;
        }).fail(function (err) {
            console.log(err)
        });
    }
    getDataflows(salesforcehome);

    function getdashboards(selectedOrg, url) {
        let postdata = {};
        postdata['url'] = url
        $.ajax({
            url: "/getdashboards",
            type: 'post',
            data: postdata,
            dataType: 'json'
        }).done(function (response) {
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
                            if (existingrowscount.length === 0) {
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
        }).fail(function (err) {
            console.log(err)
        });
    }

    // Function to salesforce dashboard metadata
    function getDashboardMetaData(selectedOrg, url) {
        let postdata = {};
        postdata['url'] = url;
        $.ajax({
            url: '/getdashboardmetadata',
            type: 'post',
            data: postdata
        }).done(function (response) {
            selectedOrg['dashboardsMetaData'][response.id] = response;
        }).fail(function (err) {
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

    var packageNameSpacePrefix;
    function getnamespaceprefix(selectedOrg) {
        $.ajax({
            url: "/getnamespace"
        }).done(function (response) {
            if (response.records[0].NamespacePrefix) {
                selectedOrg['namespaceprefix'] = response.records[0].NamespacePrefix + "__";
                if (selectedOrg['home'] === true) {
                    packageNameSpacePrefix = response.records[0].NamespacePrefix + "__";
                }
            }
        }).fail(function (err) {
            console.log(err)
        });
    }
    getnamespaceprefix(salesforcehome);

    //// On Source Change
    $("#selectedSource").change(function () {
        let selectedVal = $(this).val();
        switch (selectedVal) {
            case "github":
                if (github.loggedToGit === false) {
                    openGitHubModal(selectedVal);
                } else if (github.loggedToGit === true) {
                    $('#page1 #github').show();
                    $('#page1 #salesforce').hide();
                }
                break;

            case "salesforce":
                $('#page1 #github').hide();
                $('#page1 #salesforce').show();
                break;

            case "savedConfig":
                checkiftouchconfigobjectexists(false, true);
                break;

            default:
                $('#page1 #github').hide();
                $('#page1 #salesforce').show();
        }
    });



    // Load / save config starts
    function checkiftouchconfigobjectexists(saveconfig, loadConfig) {
        $.ajax({
            url: '/getallsobjects'
        }).done(function (response) {
            console.log(response);
            let configObjExists = response['sobjects'].find(sobj => sobj.name === packageNameSpacePrefix + "TouchConfiguration__c");
            if (!configObjExists) {
                //createtouchconfigobjectinorg(saveconfig, loadConfig);
            } else {
                if (saveconfig === true) {
                    saveConfigurationShowModal();
                }
                if (loadConfig === true) {
                    loadAllSavedConfigurations();
                }
            }
        }).fail(function (err) {
            console.log(err)
        });
    }

    function loadAllSavedConfigurations() {
        let query = "Select+Name,Id," + packageNameSpacePrefix + "ConfigName__c," + packageNameSpacePrefix;
        query += "ConfigValue__c,CreatedById+from+" + packageNameSpacePrefix + "TouchConfiguration__c+where+CreatedById='";
        query += salesforcehome['userinfo']['user_id'] + "'+order+by+createdDate+desc";
        let postdata = {};
        postdata.query = query;
        let savedConfigurations = {};
        $.ajax({
            url: '/getsavedconfigs',
            type: 'POST',
            data: postdata
        }).done(function (response) {
            let records = response.records;
            for (let i = 0; i < records.length; i++) {
                savedConfigurations[records[i]['Id']] = records[i];
            }
            showSelectConfigurationModal(savedConfigurations);
        }).fail(function (err) {
            console.log(err)
        });
    }

    // Show Modal to select last saved configuration
    function showSelectConfigurationModal(savedConfigurations) {
        $('#selectConfigurationModal #selectConfigurationdd').empty();
        let options = '';
        for (let config in savedConfigurations) {
            options += "<option value='" + config + "'>" + savedConfigurations[config][packageNameSpacePrefix + 'ConfigName__c'] + "</option>"
        }
        $('#backdrop').addClass('slds-backdrop--open');
        $('#selectConfigurationModal').addClass('slds-fade-in-open');

        $('#selectConfigurationModal #selectConfigurationdd').append(options);
    }

    // Select the last save configuration from dropdown
    $("#selectConfigurationBtn").on('click', function () {
        let selectedid = $("#selectConfigurationdd option:selected").val();
        if (selectedid === "") {
            $('#selectConfigurationModal .errorMessages').html('<p>Select a configuration</p>');
            $("#selectConfigurationModal #selectConfigurationdd").focus();
            return false;
        }
        loadLastSelected(selectedid);
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#selectConfigurationModal').removeClass('slds-fade-in-open');
    });

    // Hide/close select last saved config modal.
    $("#closeSelectConfigurationModal").on("click", function () {
        $("#selectedSource").val('salesforce').change();
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#selectConfigurationModal').removeClass('slds-fade-in-open');
    });

    // Load last selected dashboards based on last saved config selection.
    function loadLastSelected(selectedId) {
        $("#selectedSource").val('salesforce').change();
        $('#loader').show();
        for (let db in salesforcehome.dashboards) {
            if (salesforcehome['dashboards'][db]['isSelected'] === true) {
                salesforcehome['dashboards'][db]['isSelected'] = false;
            }
        }
        $("#sfDashboardsList").find("a img#TA_Label").hide();
        $("#sfDashboardsList").find("a img#DimensionLabel").show();
        $("#sfSelectedDashboardsList").empty();
        let query = "Select+Name,Id," + packageNameSpacePrefix + "ConfigName__c," + packageNameSpacePrefix;
        query += "ConfigValue__c,CreatedById+from+" + packageNameSpacePrefix + "TouchConfiguration__c+where+CreatedById='"
        query += salesforcehome['userinfo']['user_id'] + "'+and+Id='" + selectedId + "'";

        let postdata = {};
        postdata.query = query;

        $.ajax({
            url: '/getsavedconfigs',
            type: 'POST',
            data: postdata
        }).done(function (response) {
            let records = response.records;
            for (let i = 0; i < records.length; i++) {
                let values = records[i][packageNameSpacePrefix + "ConfigValue__c"];
                values = values.replace(/(&quot\;)/g, '"');
                values = JSON.parse(values);

                for (let j = 0; j < values.length; j++) {
                    let obj = salesforcehome['dashboards'].find(o => o.id === values[j]);
                    if (obj) {
                        appendSfDashboardToSelected(values[j]);
                    }
                }
            }
        }).fail(function (err) {
            console.log(err)
        });
    }




    // page1 github functions
    var github = {
        username: null,
        password: null,
        user: null,
        repos: {},
        fetchedReposFromGit: false,
        loggedToGit: false,
        domain: null,
        repoCommits: {},
        repoBranches: {},
        selectedRepo: null,
        selectedDestFolderPath: null,
        selectedDestRepo: null,
        linkedSalesForceDashboards: {},
        fetchReposFromGit: function (response) {
            let self = this;
            if (self.fetchedReposFromGit === false) {
                let get = fetchDataFromGit(self.domain + '/user/repos');
                get.done(function (data) {
                    let len = data.length;
                    for (let i = 0; i < len; i++) {
                        self.repos[data[i].name] = {};
                        self.repos[data[i].name]['attrs'] = data[i];
                        self.repos[data[i].name]['branch'] = data[i]['default_branch'];
                        self.repos[data[i].name]['content'] = {};

                        let content_url = data[i].contents_url.replace("{+path}", "");
                        self.getRootRepository(data[i].name, content_url);
                        let commits_url = data[i].commits_url.replace("{/sha}", "");
                        self.getRepositoryCommits(data[i].name, commits_url);
                        let branches_url = data[i].branches_url.replace("{/branch}", "");
                        self.getRepositoryBranches(data[i].name, branches_url);
                        appendRepoToGitReposList(data[i]);
                    }
                    prepareGithubDestList();
                    self.fetchedReposFromGit = true;
                });
            }
        },
        checkGitHubLogin: function (uname, pass, domain) {
            let self = this;
            return $.ajax({
                url: domain + "/user",
                beforeSend: function (xhr, settings) {
                    xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(uname + ":" + pass));
                }, success: function (response) {
                    self.username = response.login;
                    self.password = pass;
                    self.domain = domain;
                    self.user = response;
                    self.loggedToGit = true;
                    self.fetchReposFromGit(response);
                }, error: function (jqXHR, textStatus, errorThrown) {
                    if (jqXHR.status === 401) {
                        $('.errorMessages').html('<p>Invalid Credentials</p>');
                    } else {
                        $('.errorMessages').html('<p>Unexpected Error, Try again later..</p>');
                    }
                    console.log(jqXHR.status + ': ' + errorThrown);
                }
            });
        },
        getRootRepository: function (repo, content_url) {
            let get = fetchDataFromGit(content_url),
                self = this;
            get.done(function (response) {
                self.repos[repo]['content'] = {};
                for (let i = 0; i < response.length; i++) {
                    self.repos[repo]['content'][response[i].name] = {};
                    self.repos[repo]['content'][response[i].name]['attrs'] = response[i];
                    self.repos[repo]['content'][response[i].name]['isSelected'] = false;
                    if (response[i].type === 'file') {
                        self.repos[repo]['content'][response[i].name]['content'] = {};
                        //downloadFileFromGit(response[i],repo,gitRepos[repo]['content'][response[i].name]);
                    } else if (response[i].type === 'dir') {
                        self.repos[repo]['content'][response[i].name]['content'] = {};
                    }
                }
            });
        },
        getRepositoryCommits: function (repo, commits_url) {
            let get = fetchDataFromGit(commits_url),
                self = this;
            get.done(function (response) {
                self.repoCommits[repo] = response;
            });
        },
        getRepositoryBranches: function (repo, branches_url) {
            let get = fetchDataFromGit(branches_url),
                self = this;
            get.done(function (response) {
                self.repoBranches[repo] = response;
            });
        },
        switchCommit: function (repo, sha) {
            let get = fetchDataFromGit(this.domain + "/repos/" + this.username + "/" + repo + "/contents?ref=" + sha),
                self = this;
            get.done(function (response) {
                $('#gitRepoFilesList').empty();
                $("#gitSelectedDashboardsList").find('a[reponame="' + repo + '"]').remove();

                self.repos[repo]['content'] = {};
                self.repos[repo]['branch'] = sha;
                for (let i = 0; i < response.length; i++) {
                    self.repos[repo]['content'][response[i].name] = {};
                    self.repos[repo]['content'][response[i].name]['attrs'] = response[i];
                    self.repos[repo]['content'][response[i].name]['isSelected'] = false;
                    if (response[i].type === 'file') {
                        self.repos[repo]['content'][response[i].name]['content'] = {};
                        //downloadFileFromGit(response[i],repo,github['repos'][repo]['content'][response[i].name]);
                    } else if (response[i].type === 'dir') {
                        self.repos[repo]['content'][response[i].name]['content'] = {};
                    }
                    let selected = false;
                    appendGitFilesFolders(response[i], repo, selected)
                }
            });
        },
        switchBranch: function (repo, branch) {
            let get = fetchDataFromGit(this.domain + "/repos/" + this.username + "/" + repo + "/contents?ref=" + branch),
                self = this;
            get.done(function (response) {
                $('#gitRepoFilesList').empty();
                $("#gitSelectedDashboardsList").find('a[reponame="' + repo + '"]').remove();

                self.repos[repo]['content'] = {};
                self.repos[repo]['branch'] = branch;
                $("#gitReposList").find('a[reponame="' + repo + '"] #branches').text('( ' + branch + ' )');
                for (let i = 0; i < response.length; i++) {
                    self.repos[repo]['content'][response[i].name] = {};
                    self.repos[repo]['content'][response[i].name]['attrs'] = response[i];
                    self.repos[repo]['content'][response[i].name]['isSelected'] = false;
                    if (response[i].type === 'file') {
                        self.repos[repo]['content'][response[i].name]['content'] = {};
                        //downloadFileFromGit(response[i],repo,github['repos'][repo]['content'][response[i].name]);
                    } else if (response[i].type === 'dir') {
                        self.repos[repo]['content'][response[i].name]['content'] = {};
                    }
                    let selected = false;
                    appendGitFilesFolders(response[i], repo, selected)
                }
                let commits_url = self.repos[repo]['attrs']['commits_url'].replace("{/sha}", "?sha=" + branch);
                self.getRepositoryCommits(repo, commits_url);
                prepareGithubDestList();
            });
        },
        openGitFolder: function (reponame, url, filepath) {
            let get = fetchDataFromGit(url),
                self = this;
            get.done(function (response) {
                $('#gitRepoFilesList').empty();
                for (let i = 0; i < response.length; i++) {
                    let path = filepath.split("/");
                    let folder = self.repos[reponame]['content'];
                    $.each(path, function (index, val) {
                        folder = folder[val]['content'];
                    });

                    folder[response[i].name] = {};
                    folder[response[i].name]['attrs'] = response[i];
                    folder[response[i].name]['content'] = {};
                    folder[response[i].name]['isSelected'] = false;
                    if (response[i].type === 'file') {
                        folder[response[i].name]['isSelected'] = false;
                        self.downloadFileFromGit(response[i], reponame, folder[response[i].name])
                    }
                    appendGitFilesFolders(response[i], reponame);
                }
            });

        },
        downloadFileFromGit: function (data, reponame, file) {
            let self = this;
            $.ajax({
                url: data.url,
                beforeSend: function (xhr, settings) {
                    xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(self.username + ":" + self.password));
                },
                dataType: 'json',
                success: function (res) {

                    if (window.atob(res.content)) {
                        let response = decodeURIComponent(escape(window.atob(res.content)))//window.atob(res.content)
                        let resptype = typeof response;
                        let obj = {};
                        if (resptype === 'string') {
                            if (isJson(response)) {
                                obj = JSON.parse(response);
                            }
                        } else if (resptype === 'object') {
                            obj = response;
                        }
                        file['isSelected'] = false;
                        file['content'] = obj;
                    }
                }, error: function (jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR.status + ': ' + errorThrown);
                }
            });
        }

    };

    var fetchDataFromGit = function (dataURL) {
        // Return the $.ajax promise
        return $.ajax({
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(github['username'] + ":" + github['password']));
            },
            dataType: 'json',
            url: dataURL
        }).fail(function (jqXHR, textStatus, errorThrown) {
            // If fail
            console.log(textStatus + ': ' + errorThrown);
        });
    }

    // Show github login form
    var gitselectedval;
    function openGitHubModal(selectedVal) {
        $('#backdrop').addClass('slds-backdrop--open');
        $('#gitLoginModal').addClass('slds-fade-in-open');

        $("input#domain").val("https://api.github.com");
        gitselectedval = selectedVal;
    }

    // Close github login popup click
    $('#gitLoginModal').on('click', '#closeGitLoginModal', function () {
        closeGitHubModal();
    });

    // Modal close
    function closeGitHubModal() {
        if (currentPage === 1) {
            $("#selectedSource").val("salesforce").change();
        } else if (currentPage === 2) {
            $("#destSource").val("salesforce").change();
        }
        $('#gitLoginModal').removeClass('slds-fade-in-open');
        $('#backdrop').removeClass('slds-backdrop--open');
        $("#gitHubLoginForm").trigger('reset');
        $('.errorMessages').html('');
    }

    // Close github login popup click and get all repos and repo root files/folders.
    $('#loginToGithub').on('click', function () {
        let uname = $("input#username").val();
        if (uname === "") {
            $('.errorMessages').html('<p>Username is required</p>');
            $("input#username").focus();
            return false;
        }
        let pass = $("input#password").val();
        if (pass === "") {
            $('.errorMessages').html('<p>Password is required</p>');
            $("input#password").focus();
            return false;
        }
        let domain = $("input#domain").val();
        if (domain === "") {
            $('.errorMessages').html('<p>Domain is required</p>');
            $("input#domain").focus();
            return false;
        }
        let gitLoginPromise = [];
        let req = github.checkGitHubLogin(uname, pass, domain);
        gitLoginPromise.push(req);
        $.when.apply(null, gitLoginPromise).done(function () {
            if (currentPage === 1) {
                $("#selectedSource").val("github").change();
            } else if (currentPage === 2) {
                if (gitselectedval === "githubTemplatize") {
                    $("#destSource").val("githubTemplatize").change();
                } else {
                    $("#destSource").val("github").change();
                }
            }
            $('#gitLoginModal').removeClass('slds-fade-in-open');
            $('#backdrop').removeClass('slds-backdrop--open');
            $("#gitHubLoginForm").trigger('reset');
            $('.errorMessages').html('');
        });
    });

    // Append all fetched repos to repos list.
    function appendRepoToGitReposList(repo) {
        let newRow = '<a class="dimension" reponame="' + repo.name + '" repoid="' + repo.id + '">';
        newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
        newRow += '<label data-tooltip-on-truncation="true">' + repo.name + '';
        newRow += '<span id="branches" style="padding-left:10px" reponame="' + repo.name + '" data-tooltip-on-truncation="true">( ' + github['repos'][repo.name]['branch'] + ' )</span>';
        newRow += '<span id="commits" style="padding-left:10px" reponame="' + repo.name + '" data-tooltip-on-truncation="true">( Commits )</span>';
        newRow += '</label>';
        newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
        newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
        newRow += '</span></a>';
        $('#gitReposList').append(newRow);
    }

    // On click Repo commits link prepare repocommits dd and show repo commits popup.
    $("#gitReposList").on('click', 'a #commits', function () {
        github['selectedRepo'] = '';
        let repo = $(this).attr("reponame");
        github['selectedRepo'] = repo;
        $('#showRepoCommitsModal #selectCommitdd').empty();
        let options = '';
        for (let commit in github['repoCommits'][repo]) {
            options += "<option value='" + github['repoCommits'][repo][commit]['sha'] + "'>" + github['repoCommits'][repo][commit]['commit']['message'] + "</option>"
        }
        $('#backdrop').addClass('slds-backdrop--open');
        $('#showRepoCommitsModal').addClass('slds-fade-in-open');

        $('#showRepoCommitsModal #selectCommitdd').append(options);
    });

    // Close repo commits modal on click cancel.
    $("#closeShowRepoCommitsModal").on('click', function () {
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#showRepoCommitsModal').removeClass('slds-fade-in-open');
    });

    // Fetch and show commit Files/foldersbased on selected commit on click after selection of commit.
    $("#showRepoCommitsBtn").on('click', function () {
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#showRepoCommitsModal').removeClass('slds-fade-in-open');
        let sha = $("#showRepoCommitsModal #selectCommitdd option:selected").val();
        let repo = github['selectedRepo'];
        github.switchCommit(repo, sha);
    });

    // On click Repo branches link prepare repobranches dd and show repo branches popup.
    $("#gitReposList, #gitSelectDestFolderList").on('click', 'a #branches', function () {
        github['selectedRepo'] = '';
        let repo = $(this).attr("reponame");
        github['selectedRepo'] = repo;
        $('#showRepoBranchesModal #selectBranchdd').empty();
        let options = '';
        for (let branch in github['repoBranches'][repo]) {
            options += "<option value='" + github['repoBranches'][repo][branch]['name'] + "'>" + github['repoBranches'][repo][branch]['name'] + "</option>"
        }
        $('#backdrop').addClass('slds-backdrop--open');
        $('#showRepoBranchesModal').addClass('slds-fade-in-open');

        $('#showRepoBranchesModal #selectBranchdd').append(options);
    });

    // Close repo branches modal on click cancel.
    $("#closeShowRepoBranchesModal").on('click', function () {
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#showRepoBranchesModal').removeClass('slds-fade-in-open');
    });

    // Fetch and show branch Files/foldersbased on selected branch on click after selection of branch.
    $("#showRepoBranchesBtn").on('click', function () {
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#showRepoBranchesModal').removeClass('slds-fade-in-open');
        let branch = $("#showRepoBranchesModal #selectBranchdd option:selected").val();
        let repo = github['selectedRepo'];
        github.switchBranch(repo, branch);
    });

    // Append Files/Folders to git repo files/folders list.
    function appendGitFilesFolders(response, reponame, selected) {
        let newRow = '';
        if (response.type === 'dir') {
            newRow += '<a class="dimension" filename="' + response.name + '"  repdir="true" filepath="' + response.path + '" reponame="' + reponame + '" repourl="' + response.url + '">';
        } else if (response.type === 'file') {
            newRow += '<a class="dimension" filename="' + response.name + '" repfile="true" filepath="' + response.path + '" url="' + response.url + '" downloadurl="' + response.download_url + '" reponame="' + reponame + '">';
        }
        if (selected === true) {
            newRow += '<img style="cursor:pointer;position:relative;z-index:2;margin-left:10px;" src="images/analyticscc__TA_Label.png" width="15px" height="10px" id="TA_Label"/>';
            newRow += '<img style="cursor:pointer;position:relative;z-index:2;margin-left:10px;display:none" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px" id="DimensionLabel"/>';
        } else {
            newRow += '<img style="cursor:pointer;position:relative;z-index:2;margin-left:10px;display:none" src="images/analyticscc__TA_Label.png" width="15px" height="10px" id="TA_Label"/>';
            newRow += '<img style="cursor:pointer;position:relative;z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px" id="DimensionLabel"/>';
        }
        newRow += '<label data-tooltip-on-truncation="true">' + response.name + '</label>';
        if (response.type === 'dir') {
            newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
            //newRow += '<svg class="icon">';
            //newRow += '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/analytics/wave/web/proto/icons/sprite.analytics.svg#chevronright"></use>';
            //newRow += '</svg>';
            newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
            newRow += '</span>';
        }
        newRow += '</a>';
        $('#gitRepoFilesList').append(newRow);
    }

    // On click repo in repos list appendfiles of repo to repolist if type is file and content is empty download content from git.
    $('#gitReposList').on('click', 'a', function () {
        let reponame = $(this).attr("reponame");
        let repo = github['repos'][reponame]['content'];

        $('#gitNav').empty();
        let navlink = '<li class="slds-breadcrumb__item slds-text-title_caps"><a href="javascript:void(0);" reponame="' + reponame + '">' + reponame + '</a></li>';
        $('#gitNav').append(navlink);

        $('#gitReposList').find('a.selected').removeClass('selected');
        $(this).addClass('selected');
        $('#gitRepoFilesList').empty();
        for (let file in repo) {
            if (file != '.gitattributes') {
                if (Object.keys(repo[file]['content']).length === 0) {
                    if (repo[file]['attrs']['type'] === 'file') {
                        github.downloadFileFromGit(repo[file]['attrs'], repo, repo[file]);
                    }
                }
                let response = repo[file]['attrs'];
                appendGitFilesFolders(response, reponame);
            }
        }
    });

    /* On Click repo files/folders list
     * if type is file and content not available download the content of the file and append it to selected dbs if it is dashboards .
     * if type is folder fetch file/folders on the selected folder from git and append it to files/folders list
     * Add opened folder link to the breadcrumb
    */
    $('#gitRepoFilesList').on('click', 'a', function () {
        let reponame = $(this).attr('reponame');
        let repourl = $(this).attr('repourl');
        let filepath = $(this).attr('filepath');
        let filename = $(this).attr('filename');
        let self = $(this);
        if ($(this).attr('repdir')) {

            let path = filepath.split("/");
            let folder = github['repos'][reponame]['content'];
            $.each(path, function (index, val) {
                folder = folder[val]['content'];
            });

            if (Object.keys(folder).length === 0 && folder.constructor === Object) {
                github.openGitFolder(reponame, repourl, filepath);
            } else {
                $('#gitRepoFilesList').empty();
                for (let file in folder) {
                    let selected = false;
                    if (folder[file]['isSelected']) {
                        selected = folder[file]['isSelected']
                    }
                    let response = folder[file]['attrs'];
                    appendGitFilesFolders(response, reponame, selected);
                }
            }

            let navlink = '<li class="slds-breadcrumb__item slds-text-title_caps"><a href="javascript:void(0);" reponame="' + reponame + '" filepath="' + filepath + '">' + filename + '</a></li>';
            $('#gitNav').append(navlink);

        } else if ($(this).attr('repfile')) {
            let path = filepath.split("/");
            let folder = github['repos'][reponame]['content'];
            let i, len = path.length;
            let content = {};
            for (i = 0; i < len; i++) {
                if (i === len - 1) {
                    content = folder[path[i]];
                }
                folder = folder[path[i]]['content'];
            }
            if (content['isSelected'] === false) {
                if (Object.keys(folder).length === 0 && folder.constructor === Object) {
                    let downloadurl = $(this).attr('downloadurl');
                    let url = $(this).attr('url');
                    $.ajax({
                        url: url,
                        beforeSend: function (xhr, settings) {
                            xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(github['username'] + ":" + github['password']));
                        },
                        success: function (response) {
                            appendGitSelectedDashboards(reponame, filepath, filename, decodeURIComponent(escape(window.atob(response.content))));

                        }, error: function (jqXHR, textStatus, errorThrown) {
                            console.log(jqXHR.status + ': ' + errorThrown);
                        }
                    });
                } else {
                    appendGitSelectedDashboards(reponame, filepath, filename, content['content'])
                }
            }
        }
    });

    // Navigate through repo folders list based on click and show files/folders from the selected folder.
    $('#gitNav').on('click', 'li a', function () {
        let filepath = $(this).attr('filepath');
        let reponame = $(this).attr('reponame');
        let folder = github['repos'][reponame]['content'];

        if (filepath) {
            let path = filepath.split("/");
            $.each(path, function (index, val) {
                folder = folder[val]['content'];
            });
        }
        let index = $(this).parent('li').index();
        $('ol > li').slice(index + 1).remove();

        $('#gitRepoFilesList').empty();
        for (let file in folder) {
            let response = folder[file]['attrs']
            appendGitFilesFolders(response, reponame);
        }
    });

    // function to append dashboard to selected dashboards and also check if json is dashboard/not
    function appendGitSelectedDashboards(reponame, filepath, filename, response) {
        let path = filepath.split("/");
        let folder = github['repos'][reponame]['content'];
        let len = path.length;
        let file = '';
        for (let i = 0; i < len; i++) {
            if (i === len - 1) {
                folder[path[i]]['isSelected'] = true;
                file = folder[path[i]];
                file['content'] = response;
            }
            folder = folder[path[i]]['content'];
        }
        let resptype = typeof response;
        let obj = {};
        if (resptype === 'string') {
            if (isJson(response)) {
                obj = JSON.parse(response);
            }
        } else if (resptype === 'object') {
            obj = response;
        }
        file['content'] = obj;
        if (('folder' in obj) && ('label' in obj) && ('state' in obj)) {
            let newRow = '';
            newRow += '<a class="dimension" reponame="' + reponame + '" filename="' + filename + '" filepath="' + filepath + '">'
            newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__Delete.png" title="Delete" width="26px" height="12px" />'
            newRow += '<label data-tooltip-on-truncation="true">' + filename + '</label>'
            newRow += '</a>'
            $("#gitSelectedDashboardsList").append(newRow);
            let rep = $('#gitRepoFilesList').find('a[reponame="' + reponame + '"][filepath="' + filepath + '"]');
            rep.find("img#TA_Label").show();
            rep.find("img#DimensionLabel").hide();
        } else {
            showErrorPopup('Not a dashboard');
        }
    }

    // Function to check if string canbe converted to JSON object.
    function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    // Deselect selected dashboards from github.
    $('#gitSelectedDashboardsList').on('click', 'a', function () {
        let reponame = $(this).attr('reponame');
        let filepath = $(this).attr('filepath');
        let filename = $(this).attr('filename');
        let path = filepath.split("/");
        let folder = github['repos'][reponame]['content'];
        let len = path.length;
        let self = $(this);
        for (let i = 0; i < len; i++) {
            if (i === len - 1) {
                folder[path[i]]['isSelected'] = false;
            }
            folder = folder[path[i]]['content'];
        }
        let rep = $('#gitRepoFilesList').find('a[reponame="' + reponame + '"][filepath="' + filepath + '"]');
        rep.find("img#TA_Label").hide();
        rep.find("img#DimensionLabel").show();
        self.remove();
    });

    // Deselect all selected dashboards from  github on click.
    $('.gitSelectedDashboardsList').on('click', '#gitDeSelectAllDashboards', function () {
        $('#gitSelectedDashboardsList').find('a').click();
    });

    //End github functions






    /*Page2 code start*/

    $("#next").on("click", function () {
        let selectedSource = $('#selectedSource').val();
        if (selectedSource === 'github') {
            let selectedDashboardsLength = $('#gitSelectedDashboardsList a').length;
            if (selectedDashboardsLength <= 0) {
                showErrorPopup("Select a dashboard");
                return;
            }
            $("#destSourceContainer").hide();
            prepareSalesforceDestAppsList(salesforcehome);
            getGithubSelectedDashboards();
        } else if (selectedSource === 'salesforce') {
            let selectedDashboardsLength = $('#sfSelectedDashboardsList a').length;
            if (selectedDashboardsLength <= 0) {
                showErrorPopup("Select a dashboard");
                return;
            }
            $("#destSourceContainer").show();
            getAllSalesForceSelectedDashboards(salesforcehome);
        }

        $(".page1").hide();
        $("#selectedSourceContainer").hide();
        $("#next").hide();

        $(".page2").show();
        $("#back").show();
        $("#clone").show();
        $('#commit').hide();
        $('#download').hide();
        $("#destSource").val('salesforce');
        $('.gitSelectDestFolderList').hide();
        $('.sfSelectDestAppList').show();

        currentPage = 2;
    });

    // Functions to Get all selected dashboards from salesforce.
    // And add them to accordion
    // prepare destination apps list too.
    function getAllSalesForceSelectedDashboards(selectedOrg) {
        $("#loader").show();

        prepareSalesforceDestAppsList(selectedOrg);

        $('#page2').find('#dashboardsAccitem tbody').empty();
        $('#page2').find('#dashboardsAccitem').hide();

        $('#page2').find('#datasetsAccitem tbody').empty();
        $('#page2').find('#datasetsAccitem').hide();

        $('#page2').find('#dataflowsAccitem tbody').empty();
        $('#page2').find('#dataflowsAccitem').hide();

        $('#page2').find('#uploadDataflowsTargetAccitem tbody').empty();
        $('#page2').find('#uploadDataflowsTargetAccitem').hide();

        $('#page2').find('#linksAccitem tbody').empty();
        $('#page2').find('#linksAccitem').hide();

        $('#page2').find('#imagesAccitem tbody').empty();
        $('#page2').find('#imagesAccitem').hide();

        let len = salesforcehome['dashboards'].length;
        for (let i = 0; i < len; i++) {
            let fid = salesforcehome['dashboards'][i]['folder']['id'];
            if (salesforcehome['dashboards'][i]['isSelected'] === true) {
                let id = salesforcehome['dashboards'][i]['id'];
                if (id in salesforcehome['dashboardsMetaData']) {
                    let metaData = salesforcehome['dashboardsMetaData'][id];
                    if (selectedOrg['home'] === false) {
                        addSFDashboardtoAccordionDestAnotherSFOrg(metaData);
                    } else {
                        addSFDashboardtoAccordionDestSF(metaData);
                    }
                } else {
                    console.log(salesforcehome['dashboards'][i])
                    var postdata = {};
                    postdata.url = salesforcehome['dashboards'][i]['url'];
                    $.ajax({
                        url: '/getdashboardmetadata',
                        type: 'POST',
                        data: postdata
                    }).done(function (response) {
                        salesforcehome['dashboardsMetaData'][response.id] = response;
                        let metaData = response;
                        if (selectedOrg['home'] === false) {
                            addSFDashboardtoAccordionDestAnotherSFOrg(metaData);
                        } else {
                            addSFDashboardtoAccordionDestSF(metaData);
                        }
                    }).fail(function (err) {
                        console.log(err)
                    });
                }
            }
        }

        $("#loader").hide();

    }

    function prepareSalesforceDestAppsList(selectedOrg) {
        let selectedSource = $('#selectedSource').val();
        $('#sfSelectDestAppList').empty();
        for (let id in selectedOrg['folders']) {
            let newRow = '';
            let folder = selectedOrg['folders'][id];
            if ((selectedSource === 'salesforce') && (folder['isSelected'] === true)) {
                newRow += '<a class="dimension disabled" folderid="' + folder['id'] + '" title="This Application cannot be selected" style="background-color: #efefef !important;">';
            } else {
                newRow += '<a class="dimension" folderid="' + folder['id'] + '">';
            }
            newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
            newRow += '<label data-tooltip-on-truncation="true">' + folder['label'] + '</label>';
            newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
            newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
            newRow += '</span></a>';
            $('#sfSelectDestAppList').append(newRow);
        }
    }


    function addSFDashboardtoAccordionDestSF(data) {
        if (!('label' in data.folder)) {
            data.folder.label = 'My Private App';
        }
        if (data.datasets) {
            let datasetslen = data.datasets.length;
            for (let i = 0; i < datasetslen; i++) {
                let dname = data.datasets[i].name;
                let rows = $('#page2 #datasetsAccitem').find('tr[datasetname="' + dname + '"]');
                if (rows.length === 0) {
                    let folder;
                    if (data.datasets[i].id) {
                        folder = salesforcehome['datasets'][data.datasets[i].id]['folder'];
                    }
                    let datasetrow = "<tr datasetname='" + dname + "' targetdatasetname='" + dname + "'>";
                    datasetrow += "<td title='" + dname + "'><div class='slds-truncate'>" + dname + "</div></td>";
                    if (folder) {
                        datasetrow += "<td><div class='slds-truncate' title='" + folder.label + "'>" + folder.label + "</div></td></tr>";
                    } else {
                        datasetrow += "<td><div class='slds-truncate'></div></td></tr>";
                    }
                    $('#page2').find('#datasetsAccitem').show();
                    $('#page2').find('#datasetsAccitem tbody').append(datasetrow);
                }
                let dataflowrows = $('#page2 #dataflowsAccitem').find('tr[dataflowname="' + dname + '"]');
                if (dataflowrows.length === 0) {
                    let dataflowrow = "<tr dataflowname='" + dname + "' targetdataflowname='" + dname + "'>";
                    dataflowrow += "<td title='" + dname + "'><div class='slds-truncate'>" + dname + "</div></td>";
                    dataflowrow += "<td>" + prepareDataflowsDropDown(dname, salesforcehome) + "</td></tr>";
                    $('#page2').find('#dataflowsAccitem').show();
                    $('#page2').find('#dataflowsAccitem tbody').append(dataflowrow);
                }
            }
        }

        let dashboardrow = "<tr dashboardid='" + data.id + "' folderid='" + data.folder.id + "'>";
        dashboardrow += "<td><div class='slds-truncate' title='" + data.label + "'>" + data.label + "</div></td>";
        dashboardrow += "<td><div class='slds-truncate' title='" + data.folder.label + "'>" + data.folder.label + "</div></td></tr>";
        $('#page2').find('#dashboardsAccitem').show();
        $('#page2').find('#dashboardsAccitem tbody').append(dashboardrow);

        let widgets = data.state.widgets;
        for (let key in widgets) {
            let widget = widgets[key];
            if ((widget.parameters.destinationType) && (widget.parameters.destinationType === 'dashboard')) {
                if (widget.parameters.destinationLink && widget.parameters.destinationLink.name) {
                    let result = salesforcehome['dashboards'].filter(function (obj) {
                        return obj.name === widget.parameters.destinationLink.name;
                    });
                    if (result.length > 0) {
                        if (result[0]['isSelected'] === false) {
                            let linkrow = "<tr dashboardid='" + result[0].id + "' folderid='" + result[0].folder.id + "'>";
                            linkrow += "<td><div class='slds-truncate' title='" + result[0].label + "'>" + result[0].label + "</div></td>";
                            linkrow += "<td><div class='slds-truncate' title='" + result[0].folder.label + "'>" + result[0].folder.label + "</div></td></tr>";
                            let rows2 = $('#page2 #linksAccitem tbody').find("tr[dashboardid='" + result[0].id + "'][folderid='" + result[0].folder.id + "']");
                            if (rows2.length === 0) {
                                $('#page2').find('#linksAccitem').show();
                                $('#page2').find('#linksAccitem tbody').append(linkrow);
                            }
                        }
                    }
                }
            }
        }
    }

    function addSFDashboardtoAccordionDestAnotherSFOrg(data) {

        //append the dashboard to dashboards accordion.
        let row = $('#page2 #linksAccitem').find('tbody tr[dashboardname="' + data.name + '"]');
        if (row.length === 0) {
            let dashboardrow = "<tr dashboardname='" + data.name + "' dashboardid='" + data.id + "' folderid='" + data.folder.id + "'>";
            dashboardrow += "<td><div class='slds-truncate' title='" + data.label + "'>" + data.label + "</div></td>";
            dashboardrow += "<td><div class='slds-truncate' title='" + data.folder.label + "'>" + data.folder.label + "</div></td>";
            dashboardrow += "</tr>";
            $('#page2').find('#dashboardsAccitem').show();
            $('#page2').find('#dashboardsAccitem tbody').append(dashboardrow);
        }

        //Check for datasets in db datsets and append it to datsets accordion
        if (data.datasets) {
            let datasetslen = data.datasets.length;
            for (let i = 0; i < datasetslen; i++) {
                let dname = data.datasets[i].name;
                appendDatasetsToAccordionForAnotherSFOrg(dname);
            }
        }

        for (let mappeddataset in mappedDataFlows) {
            let dataflowrows = $('#page2 #uploadDataflowsTargetAccitem').find('tr[dataflowname="' + mappeddataset + '"]');
            if (dataflowrows.length === 0) {
                let dataflowrow = "<tr selectedDataFlow='" + mappedDataFlows[mappeddataset] + "' dataflowname='" + mappeddataset + "' targetdataflowname='" + mappeddataset + "'>";
                dataflowrow += "<td title='" + mappeddataset + "'><div class='slds-truncate'>" + mappeddataset + "</div></td>";
                dataflowrow += "<td>" + prepareDataflowsDropDown(mappeddataset, anothersalesforceorg) + "</td></tr>";
                $('#page2').find('#uploadDataflowsTargetAccitem').show();
                $('#page2').find('#uploadDataflowsTargetAccitem tbody').append(dataflowrow);
            }
        }

        //Check for datasets in db state.steps and append it to datsets accordion
        //remove namespace in step query
        if (data.state && data.state.steps) {
            let steps = data.state.steps;
            for (let step in steps) {
                let datasets = steps[step]['datasets'];
                if (datasets) {
                    let dlen = datasets.length;
                    for (let j = 0; j < dlen; j++) {
                        let dname = datasets[j]['name'];
                        appendDatasetsToAccordionForAnotherSFOrg(dname);
                    }
                }
                let query = steps[step]['query'];
                let namespaceinquery = "";
                if (data.namespace) {
                    namespaceinquery = new RegExp(data.namespace + "__", 'g')
                }
                if (query && typeof query === "string") {

                    if (data.namespace) {
                        steps[step]['query'] = steps[step]['query'].replace(namespaceinquery, "");
                    }
                }
                if (query && (typeof query === 'object')) {
                    if (steps[step]['query']['query'] && typeof steps[step]['query']['query'] === 'string') {
                        let q2 = steps[step]['query']['query'];
                        if (data.namespace) {
                            q2 = q2.replace(namespaceinquery, "");
                        }
                        steps[step]['query']['query'] = q2;
                    }
                }
            }
        }

        //Check for images in db state.gridLayouts and append it to images accordion
        if (data['state'] && data['state']['gridLayouts']) {
            let gridLays = data['state']['gridLayouts'], gridLayslen = data['state']['gridLayouts'].length;
            for (let i = 0; i < gridLayslen; i++) {
                if (gridLays[i]['style'] && gridLays[i]['style']['image']) {
                    let image = gridLays[i]['style']['image'];
                    appendImagesToAccordionForAnotherSFOrg(image['name']);
                }
            }
        }

        //Check for destination type in sb state.widgets for dashboard and append it to links accordion
        if (data.state && data.state.widgets) {
            let widgets = data.state.widgets;
            for (let key in widgets) {
                let widget = widgets[key];
                if ((widget.parameters.destinationType) && (widget.parameters.destinationType === 'dashboard')) {
                    if (widget.parameters.destinationLink && widget.parameters.destinationLink.name) {

                        let result = salesforcehome['dashboards'].filter(function (obj) {
                            return obj.name === widget.parameters.destinationLink.name;
                        });
                        if (result.length > 0) {
                            if (result[0]['isSelected'] === false) {
                                appendLinksToAccordionForAnotherSFOrg(result[0]);
                            }
                        }

                    }
                }
                if (widget.parameters.image) { //widget.type === "image"
                    let image = widget.parameters.image
                    appendImagesToAccordionForAnotherSFOrg(image['name']);
                }
            }
        }
    }

    function appendDatasetsToAccordionForAnotherSFOrg(dname) {
        let rows = $('#page2 #datasetsAccitem').find('tr[datasetname="' + dname + '"]');
        if (rows.length === 0) {
            let datasetrow = "<tr datasetname='" + dname + "' targetdatasetname='" + dname + "'>";
            datasetrow += "<td title='" + dname + "'><div class='slds-truncate'>" + dname + "</div></td>";
            datasetrow += "<td>" + prepareDatasetsDropDown(dname, anothersalesforceorg) + "</td></tr>";
            $('#page2').find('#datasetsAccitem').show();
            $('#page2').find('#datasetsAccitem tbody').append(datasetrow);
        }
    }

    function appendLinksToAccordionForAnotherSFOrg(link) {
        let foundup = $('#page2 #linksAccitem').find('tbody tr[dashboardname="' + link.name + '"]');
        if (foundup.length === 0) {
            let linkrow = "<tr dashboardname='" + link.name + "' targetdashboardname='" + link.name + "'dashboardid='" + link.id + "' folderid='" + link.folder.id + "'>";
            linkrow += "<td><div class='slds-truncate' title='" + link.name + "'>" + link.name + "</div></td>";
            linkrow += "<td>" + prepareDashboardsDropDown(link.name, anothersalesforceorg) + "</td></tr>";
            $('#page2').find('#linksAccitem').show();
            $('#page2').find('#linksAccitem tbody').append(linkrow);
        }
    }

    function appendImagesToAccordionForAnotherSFOrg(image) {
        let foundup = $('#page2 #imagesAccitem').find('tbody tr[imagename="' + image + '"]');
        if (foundup.length === 0) {
            let linkrow = "<tr imagename='" + image + "' targetimagename='" + image + "'>";
            linkrow += "<td title='" + image + "'><div class='slds-truncate'>" + image + "</div></td>";
            linkrow += "<td>" + prepareImagesDropDown(image, anothersalesforceorg) + "</td></tr>";
            $('#page2').find('#imagesAccitem').show();
            $('#page2').find('#imagesAccitem tbody').append(linkrow);
        }
    }

    //Function to select dest salesforce app
    $('#sfSelectDestAppList').on('click', 'a', function () {
        if ($(this).hasClass("disabled")) {
            showErrorPopup("This Application cannot be selected");
        } else {
            $('#sfSelectDestAppList').find('a.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });



    // function to get all github selected dashboards and show error popup if none selected.
    function getGithubSelectedDashboards() {

        github.linkedSalesForceDashboards = {};
        $('#selectApplication').empty();
        for (let repo in github['repos']) {
            loopFolder(github['repos'][repo]['content'], repo);
        }
        function loopFolder(folder, repo) {
            for (let key1 in folder) {
                let file = folder[key1];
                if (file['attrs'].type === 'file') {
                    if ((file['isSelected']) && (file['isSelected'] === true)) {
                        prepareGithubAccordion(file['content'], folder, repo);
                    }
                } else if (file['attrs'].type === 'dir') {
                    loopFolder(file['content'], repo);
                }
            }
        }
    }

    function detemplatizebyiteratingdashboard(obj) {
        for (let property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (typeof obj[property] === "object") {
                    detemplatizebyiteratingdashboard(obj[property]);
                } else {
                    if (typeof obj[property] === "string") {
                        obj[property] = obj[property].replace(/(\\${App.EdgeMarts.)/g, "");
                        obj[property] = obj[property].replace(/(.Alias})/g, "");
                    }
                }
            }
        }
        return obj;
    }

    // Function to Prepare github accordion if selected source is github.
    // Append all selected dbs to accordion
    // Append all selected dbs datasets to accordion with salesforce datasets dd
    // Append all selected dbs links to accordion with salesforce dashboards dd
    // Append all selected dbs Images to accordion with salesforce images dd
    function prepareGithubAccordion(db, folder, reponame) {

        let data = detemplatizebyiteratingdashboard(db);

        //append the dashboard to dashboards accordion.
        let dashboardrow = "<tr dashboardname='" + data.name + "' dashboardid='" + data.id + "' folderid='" + data.folder.id + "'>";
        dashboardrow += "<td><div class='slds-truncate' title='" + data.label + "'>" + data.label + "</div></td>";
        //dashboardrow += "<td><div class='slds-truncate' title='"+data.folder.label+"'>"+data.folder.label+"</div></td>";
        dashboardrow += "</tr>";
        $('#page2').find('#dashboardsAccitem tbody').append(dashboardrow);
        let row = $('#page2 #linksAccitem').find('tbody tr[dashboardname="' + data.name + '"]');
        if (row.length > 0) {
            row.remove();
        }

        //Check for datasets in db datsets and append it to datsets accordion
        if (data.datasets) {
            let datasetslen = data.datasets.length;
            for (let i = 0; i < datasetslen; i++) {
                let dname = data.datasets[i].name;
                dname = dname.replace("${App.EdgeMarts.", "");
                dname = dname.replace(".Alias}", "");
                if (data.namespace) {
                    dname = dname.replace(data.namespace + "__", "");
                }
                data.datasets[i].name = dname;
                let rows = $('#page2 #datasetsAccitem').find('tr[datasetname="' + dname + '"]');
                if (rows.length === 0) {
                    let datasetrow = "<tr datasetname='" + dname + "' targetdatasetname='" + dname + "'>";
                    datasetrow += "<td title='" + dname + "'><div class='slds-truncate'>" + dname + "</div></td>";
                    datasetrow += "<td>" + prepareDatasetsDropDown(dname, salesforcehome) + "</td></tr>";
                    $('#page2').find('#datasetsAccitem tbody').append(datasetrow);
                }
            }
        }

        //Check for datasets in db state.steps and append it to datsets accordion
        //remove namespace in step query
        if (data.state && data.state.steps) {
            let steps = data.state.steps;
            for (let step in steps) {
                let datasets = steps[step]['datasets'];
                if (datasets) {
                    let dlen = datasets.length;
                    for (let j = 0; j < dlen; j++) {
                        datasets[j]['name'] = datasets[j]['name'].replace("${App.EdgeMarts.", "");
                        datasets[j]['name'] = datasets[j]['name'].replace(".Alias}", "");
                        data['state']['steps'][step]['datasets'][j]['name'] = datasets[j]['name'];

                        let rows = $('#page2 #datasetsAccitem').find('tr[datasetname="' + datasets[j]['name'] + '"]');
                        if (rows.length === 0) {
                            let datasetrow = "<tr datasetname='" + datasets[j]['name'] + "' targetdatasetname='" + datasets[j]['name'] + "'>";
                            datasetrow += "<td title='" + datasets[j]['name'] + "'><div class='slds-truncate'>" + datasets[j]['name'] + "</div></td>";
                            datasetrow += "<td>" + prepareDatasetsDropDown(datasets[j]['name'], salesforcehome) + "</td></tr>";
                            $('#page2').find('#datasetsAccitem tbody').append(datasetrow);
                        }

                    }
                }
                let query = steps[step]['query'];
                let namespaceinquery = "";
                if (data.namespace) {
                    namespaceinquery = new RegExp(data.namespace + "__", 'g')
                }
                if (query && typeof query === "string") {

                    if (data.namespace) {
                        steps[step]['query'] = steps[step]['query'].replace(namespaceinquery, "");
                    }
                    steps[step]['query'] = steps[step]['query'].replace(/(&lt\;)/g, '<');
                    steps[step]['query'] = steps[step]['query'].replace(/(&gt\;)/g, '>');
                }
                if (query && (typeof query === 'object')) {
                    if (steps[step]['query']['query'] && typeof steps[step]['query']['query'] === 'string') {
                        let q2 = steps[step]['query']['query'];
                        if (data.namespace) {
                            q2 = q2.replace(namespaceinquery, "");
                        }
                        q2 = q2.replace(/(&lt\;)/g, '<');
                        q2 = q2.replace(/(&gt\;)/g, '>');
                        steps[step]['query']['query'] = q2;
                    }
                }
            }
        }

        //Check for images in db state.gridLayouts and append it to images accordion
        if (data['state'] && data['state']['gridLayouts']) {
            let gridLays = data['state']['gridLayouts'], gridLayslen = data['state']['gridLayouts'].length;
            for (let i = 0; i < gridLayslen; i++) {
                if (gridLays[i]['style'] && gridLays[i]['style']['image']) {
                    let image = gridLays[i]['style']['image'];
                    let linkrow = "<tr imagename='" + image.name + "' targetimagename='" + image.name + "'>";
                    linkrow += "<td title='" + image.name + "'><div class='slds-truncate'>" + image.name + "</div></td>";
                    linkrow += "<td>" + prepareImagesDropDown(image.name, salesforcehome) + "</td></tr>";
                    let foundup = $('#page2 #imagesAccitem').find('tbody tr[imagename="' + image.name + '"]');
                    if (foundup.length === 0) {
                        $('#page2').find('#imagesAccitem').show();
                        $('#page2').find('#imagesAccitem tbody').append(linkrow);
                    }
                }
            }
        }

        //Check for destination type in sb state.widgets for dashboard and append it to links accordion
        if (data.state && data.state.widgets) {
            let widgets = data.state.widgets;
            for (let key in widgets) {
                let widget = widgets[key];
                if ((widget.parameters.destinationType) && (widget.parameters.destinationType === 'dashboard')) {
                    if (widget.parameters.destinationLink && widget.parameters.destinationLink.name) {
                        let dname = widget.parameters.destinationLink.name;
                        let rows2 = $('#page2 #dashboardsAccitem').find('tbody tr[dashboardname="' + dname + '"]');
                        if (rows2.length === 0) {
                            let linkrow = "<tr dashboardname='" + dname + "' targetdashboardname='" + dname + "'>";
                            linkrow += "<td title='" + dname + "'><div class='slds-truncate'>" + dname + "</div></td>";
                            linkrow += "<td>" + prepareDashboardsDropDown(dname, salesforcehome) + "</td></tr>";
                            let foundup = $('#page2 #linksAccitem').find('tbody tr[dashboardname="' + dname + '"]');
                            if (foundup.length === 0) {
                                $('#page2').find('#linksAccitem').show();
                                $('#page2').find('#linksAccitem tbody').append(linkrow);
                            }
                        }
                    }
                }
                if (widget.parameters.image) { //widget.type === "image"
                    let image = widget.parameters.image
                    let linkrow = "<tr imagename='" + image.name + "' targetimagename='" + image.name + "'>";
                    linkrow += "<td title='" + image.name + "'><div class='slds-truncate'>" + image.name + "</div></td>";
                    linkrow += "<td>" + prepareImagesDropDown(image.name, salesforcehome) + "</td></tr>";
                    let foundup = $('#page2 #imagesAccitem').find('tbody tr[imagename="' + image.name + '"]');
                    if (foundup.length === 0) {
                        $('#page2').find('#imagesAccitem').show();
                        $('#page2').find('#imagesAccitem tbody').append(linkrow);
                    }
                }
            }
        }
    }

    // Prepare Github destination repos/folders list
    function prepareGithubDestList() {

        $('#gitSelectDestFolderList').empty();
        for (let key in github['repos']) {
            let repo = github['repos'][key];
            let newRow = '';
            newRow += '<a class="dimension" repohome="true" reponame="' + key + '" filename="' + key + '" repopath="">';
            newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
            newRow += '<label data-tooltip-on-truncation="true">' + repo['attrs'].name;
            newRow += '<span id="branches" style="padding-left:10px" reponame="' + repo['attrs'].name + '" data-tooltip-on-truncation="true">( ' + repo['branch'] + ' )</span>';
            newRow += '</label>';
            newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
            //newRow += '<svg class="icon">';
            //newRow += '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/analytics/wave/web/proto/icons/sprite.analytics.svg#chevronright"></use>';
            //newRow += '</svg>';
            newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
            newRow += '</span></a>';
            $('#gitSelectDestFolderList').append(newRow);
        }
        $('#selectedGitDestFolderNav').empty();
        let navlink = '<li class="slds-breadcrumb__item slds-text-title_caps"><a href="javascript:void(0);" id="selectGitFolderAllRepoBtn" allrepos="true">Repos</a></li>';
        $('#selectedGitDestFolderNav').append(navlink);
    }

    // On click repo in page if content not availabe download and show folders list.
    // if type is repo/home show root folders of repo and make the repo selected.
    // if type is dir make the dir selected.
    // add folder link to breadcrumb
    $('#gitSelectDestFolderList').on('click', 'a', function () {
        $('#gitSelectDestFolderList').empty();
        let reponame = $(this).attr('reponame');
        let filename = $(this).attr('filename');
        if ($(this).attr('repohome')) {
            github['selectedDestFolderPath'] = "";//reponame+"/contents"
            github['selectedDestRepo'] = reponame;
            let navlink = '<li class="slds-breadcrumb__item slds-text-title_caps"><a href="javascript:void(0);" reponame="' + reponame + '" filepath="">' + filename + '</a></li>';
            $('#selectedGitDestFolderNav').append(navlink);
            let content = github['repos'][reponame]['content'];
            for (let file in content) {
                if (content[file]['attrs'].type === 'dir') {
                    let newRow = '';
                    newRow += '<a class="dimension" filename="' + content[file]['attrs'].name + '" repodir="true" repourl="' + content[file]['attrs'].url + '" reponame="' + reponame + '" repopath="' + content[file]['attrs'].path + '">';
                    newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
                    newRow += '<label data-tooltip-on-truncation="true">' + content[file]['attrs'].name + '</label>';
                    newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
                    //newRow += '<svg class="icon">';
                    //newRow += '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/analytics/wave/web/proto/icons/sprite.analytics.svg#chevronright"></use>';
                    //newRow += '</svg>';
                    newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
                    newRow += '</span></a>';
                    $('#gitSelectDestFolderList').append(newRow);
                }
            }
        } else if ($(this).attr('repodir')) {
            github['selectedDestFolderPath'] = null;
            let repopath = $(this).attr('repopath');
            let repourl = $(this).attr('repourl');
            github['selectedDestFolderPath'] = repopath + "/"; //reponame+"/contents/"+repopath;
            github['selectedDestRepo'] = reponame;
            //$("#selectedGitDestFolder").html(reponame+'/'+repopath);
            let navlink = '<li class="slds-breadcrumb__item slds-text-title_caps"><a href="javascript:void(0);" reponame="' + reponame + '" filepath="' + repopath + '">' + filename + '</a></li>';
            $('#selectedGitDestFolderNav').append(navlink);
            let path = repopath.split("/");
            let content = github['repos'][reponame]['content'];
            $.each(path, function (index, val) {
                content = content[val]['content'];
            });
            if (Object.keys(content).length === 0 && content.constructor === Object) {
                let get = fetchDataFromGit(repourl);
                get.done(function (response) {
                    $('#gitRepoFilesList').empty();
                    for (let i = 0; i < response.length; i++) {

                        let path = repopath.split("/");
                        let folder = github['repos'][reponame]['content'];
                        $.each(path, function (index, val) {
                            folder = folder[val]['content'];
                        });

                        folder[response[i].name] = {};
                        folder[response[i].name]['attrs'] = response[i];
                        folder[response[i].name]['content'] = {};
                        if (response[i].type === 'file') {
                            folder[response[i].name]['isSelected'] = false;
                        }
                        if (response[i].type === 'dir') {
                            let newRow = '';
                            newRow += '<a class="dimension" filename="' + response[i].name + '" repodir="true" repourl="' + response[i].url + '" reponame="' + reponame + '" repopath="' + response[i].path + '">';
                            newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
                            newRow += '<label data-tooltip-on-truncation="true">' + response[i].name + '</label>';
                            newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
                            //newRow += '<svg class="icon">';
                            //newRow += '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/analytics/wave/web/proto/icons/sprite.analytics.svg#chevronright"></use>';
                            //newRow += '</svg>';
                            newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
                            newRow += '</span></a>';
                            $('#gitSelectDestFolderList').append(newRow);
                        }
                    }
                });

            } else {
                for (let file in content) {
                    if (content[file]['attrs'].type === 'dir') {
                        let newRow = '';
                        newRow += '<a class="dimension" filename="' + content[file]['attrs'].name + '" repodir="true" repourl="' + content[file]['attrs'].url + '" reponame="' + reponame + '" repopath="' + content[file]['attrs'].path + '">';
                        newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
                        newRow += '<label data-tooltip-on-truncation="true">' + content[file]['attrs'].name + '</label>';
                        newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
                        //newRow += '<svg class="icon">';
                        //newRow += '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/analytics/wave/web/proto/icons/sprite.analytics.svg#chevronright"></use>';
                        //newRow += '</svg>';
                        newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
                        newRow += '</span></a>';
                        $('#gitSelectDestFolderList').append(newRow);
                    }
                }
            }
        }
    });

    // Show all repos on click in page2.
    $('#selectedGitDestFolderNav').on('click', '#selectGitFolderAllRepoBtn', function () {
        $('#gitSelectDestFolderList').empty();
        let index = $(this).parent('li').index();
        $('ol > li').slice(index + 1).remove();
        github['selectedDestFolderPath'] = null;
        github['selectedDestRepo'] = null;
        for (let key in github['repos']) {
            let repo = github['repos'][key];
            let newRow = '';
            newRow += '<a class="dimension" repohome="true" reponame="' + key + '" filename="' + key + '" repopath="">';
            newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
            newRow += '<label data-tooltip-on-truncation="true">' + repo['attrs'].name;
            newRow += '<span id="branches" style="padding-left:10px" reponame="' + repo['attrs'].name + '" data-tooltip-on-truncation="true">( ' + repo['branch'] + ' )</span>';
            newRow += '</label>';
            newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
            //newRow += '<svg class="icon">';
            //newRow += '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/analytics/wave/web/proto/icons/sprite.analytics.svg#chevronright"></use>';
            //newRow += '</svg>';
            newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
            newRow += '</span></a>';
            $('#gitSelectDestFolderList').append(newRow);
        }
    });

    // Navigate through repo folders on selecting/clicking link in breadcrumb.
    $('#selectedGitDestFolderNav').on('click', 'li a', function () {
        if (!($(this).attr('allrepos'))) {
            let filepath = $(this).attr('filepath');
            let reponame = $(this).attr('reponame');
            let folder = github['repos'][reponame]['content'];
            if (filepath) {
                let path = filepath.split("/");
                $.each(path, function (index, val) {
                    folder = folder[val]['content'];
                });
            }
            github['selectedDestFolderPath'] = reponame + "/contents" + filepath;
            github['selectedDestRepo'] = reponame;
            let index = $(this).parent('li').index();
            $('ol > li').slice(index + 1).remove();

            $('#gitSelectDestFolderList').empty();
            for (let file in folder) {
                let response = folder[file]['attrs']
                //appendGitFilesFolders(response,reponame);
                if (response.type === 'dir') {
                    let newRow = '';
                    newRow += '<a class="dimension" filename="' + response.name + '" repodir="true" repourl="' + response.url + '" reponame="' + reponame + '" repopath="' + response.path + '">';
                    newRow += '<img style="cursor:pointer;position:relative; z-index:2;margin-left:10px" src="images/analyticscc__DimensionLabel.png" width="15px" height="10px"/>';
                    newRow += '<label data-tooltip-on-truncation="true">' + response.name + '</label>';
                    newRow += '<span class="valuesbtn"><span class="chevronLeftIcon"></span>';
                    //newRow += '<svg class="icon">';
                    //newRow += '<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="/analytics/wave/web/proto/icons/sprite.analytics.svg#chevronright"></use>';
                    //newRow += '</svg>';
                    newRow += '<img src="images/chevronright_60.png" width="15px" height="10px"/>';
                    newRow += '</span></a>';
                    $('#gitSelectDestFolderList').append(newRow);
                }
            }
        }
    });



    // On destination source change( function to handle dd in page2 )
    $("#destSource").change(function () {
        let selectedVal = $(this).val();
        switch (selectedVal) {
            case "github":
                if (github['loggedToGit'] === false) {
                    openGitHubModal(selectedVal);
                } else if (github['loggedToGit'] === true) {
                    $('.gitSelectDestFolderList').show();
                    $('.sfSelectDestAppList').hide();
                }
                getAllSalesForceSelectedDashboards(salesforcehome);
                $('#commit').show();
                $('#clone').hide();
                $('#download').hide();
                break;

            case "githubTemplatize":
                if (github['loggedToGit'] === false) {
                    openGitHubModal(selectedVal);
                } else if (github['loggedToGit'] === true) {
                    $('.gitSelectDestFolderList').show();
                    $('.sfSelectDestAppList').hide();
                }
                getAllSalesForceSelectedDashboards(salesforcehome);
                $('#commit').show();
                $('#clone').hide();
                $('#download').hide();
                break;

            case "salesforce":
                getAllSalesForceSelectedDashboards(salesforcehome);
                $('.gitSelectDestFolderList').hide();
                $('.sfSelectDestAppList').show();
                $('#clone').show();
                $('#commit').hide();
                $('#download').hide();
                break;

            case "download":
                getAllSalesForceSelectedDashboards(salesforcehome);
                $('.gitSelectDestFolderList').hide();
                $('.sfSelectDestAppList').show();
                $('#clone').hide();
                $('#commit').hide();
                $('#download').show();
                break;

            case "downloadTemplatize":
                getAllSalesForceSelectedDashboards(salesforcehome);
                $('.gitSelectDestFolderList').hide();
                $('.sfSelectDestAppList').show();
                $('#clone').hide();
                $('#commit').hide();
                $('#download').show();
                break;

            case "anothersalesforceorg":
                if (anothersalesforceorg['loggedIn'] === false) {
                    showSalesforceLoginModal();
                    $('.gitSelectDestFolderList').hide();
                    $('.sfSelectDestAppList').show();
                } else if (anothersalesforceorg['loggedIn'] === true) {
                    getAllSalesForceSelectedDashboards(anothersalesforceorg);
                    $('.gitSelectDestFolderList').hide();
                    $('.sfSelectDestAppList').show();
                }
                $('#clone').show();
                $('#commit').hide();
                $('#download').hide();
                break;

            default:
                $('.gitSelectDestFolderList').hide();
                $('.sfSelectDestAppList').show();
                $('#clone').show();
                $('#commit').hide();
                $('#download').hide();
        }
    });



    //Salesforce Login Popup functions
    function showSalesforceLoginModal() {
        $('#backdrop').addClass('slds-backdrop--open');
        $('#salesforceLoginModal').addClass('slds-fade-in-open');
        $("input#salesforceusername").val('bharathreddy848@gmail.com');
        $("input#salesforcepassword").val('Bharath_1234');
        $("input#salesforceSecretKey").val('kh5GEONpMU5enqvPv86h0dyjX');
    }

    $("#closeSalesforceLoginModal").on("click", function () {
        $("#destSource").val('salesforce').change();
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#salesforceLoginModal').removeClass('slds-fade-in-open');
    });

    $('#loginToSalesforce').on('click', function () {
        let uname = $("input#salesforceusername").val();
        if (uname === "") {
            $('.errorMessages').html('<p>Username is required</p>');
            $("input#salesforceusername").focus();
            return false;
        }
        let pass = $("input#salesforcepassword").val();
        if (pass === "") {
            $('.errorMessages').html('<p>Password is required</p>');
            $("input#salesforcepassword").focus();
            return false;
        }
        let SecretKey = $("input#salesforceSecretKey").val();
        if (SecretKey === "") {
            $('.errorMessages').html('<p>Secret Key is required</p>');
            $("input#salesforceSecretKey").focus();
            return false;
        }
        let salesforcePassWithSecretKey = pass + "" + SecretKey;
        let environment = $("#salesforceEnvironment").val();

        let loginPromise = [];
        let req = loginUser(uname, salesforcePassWithSecretKey, anothersalesforceorg, environment);
        loginPromise.push(req);
        $.when.apply(null, loginPromise).done(function () {
            $('#salesforceLoginModal').removeClass('slds-fade-in-open');
            $('#backdrop').removeClass('slds-backdrop--open');
            $("#salesforceLoginForm").trigger('reset');
            $('.errorMessages').html('');
        });
    });


    function loginUser(username, password, selectedOrg, environment) {
        //pradeep.571@gmail.com
        //bobby1234jEuuG2UFSuUjnYjP7jUyfX9t
        //console.log(username, password, selectedOrg, environment);
        let soapRequest = '<?xml version="1.0" encoding="utf-8"?>';
        soapRequest += '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com">';
        soapRequest += '<soapenv:Body>';
        soapRequest += '<urn:login>';
        soapRequest += '<urn:username>' + username + '</urn:username>';
        soapRequest += '<urn:password>' + password + '</urn:password>';
        soapRequest += '</urn:login>';
        soapRequest += '</soapenv:Body>';
        soapRequest += '</soapenv:Envelope>';

        let requrl = 'https://login.salesforce.com/services/Soap/c/42.0/0DF7F000000g4V7';
        if(environment === 'sandbox'){
            requrl = 'https://test.salesforce.com/services/Soap/c/42.0/0DF7F000000g4V7';
        }

        console.log(requrl);
        
        return $.ajax({
            type: "POST",
            url: proxyurl + requrl,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("SOAPAction", "\"\"");
                xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
                xhr.setRequestHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, TRACE, OPTIONS');
                xhr.setRequestHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Range, Content-Disposition, Content-Description');
            },
            contentType: "text/xml; charset=\"utf-8\"",
            data: soapRequest,
            crossDomain: true,
        }).done(function (response) {

            //console.log(response);
            let token = response.getElementsByTagName("sessionId")[0].innerHTML;

            selectedOrg.session = token;
            selectedOrg.loggedIn = true;

            selectedOrg.userId = response.getElementsByTagName("userId")[0].innerHTML;

            let orgname = response.getElementsByTagName("serverUrl")[0].innerHTML;
            let pathArray = orgname.split("/");
            let newPathname = "";
            //find & remove port number
            newPathname = newPathname.split(':')[0];
            //find & remove "?"
            newPathname = newPathname.split('?')[0];
            if (orgname.indexOf("://") > -1) {
                newPathname += pathArray[0];
                for (let i = 1; i < pathArray.length; i++) {
                    newPathname += "/";
                    newPathname += pathArray[i];
                    if (i === 2) {
                        break;
                    }
                }
            }
            else {
                newPathname = orgname.split('/')[0];
            }
            selectedOrg.orgname = newPathname + "/";

            // init page by loading current salesforce org
            getSalesForceDataByOrg(selectedOrg);

        }).fail(function (error) {
            if (error.status === 401) {
                $('.errorMessages').html('<p>Invalid Credentials</p>');
            } else {
                $('.errorMessages').html('<p>Unexpected Error, Try again later..</p>');
            }
            console.log(error);
        });

    }



    // function to prepare salesforce datasets dd and make dataset selected if dataset found in salesforce.
    function prepareDatasetsDropDown(dname, selectedOrg) {
        let datasetsdd = '';
        datasetsdd += '<div class="slds-form-element__control">';
        datasetsdd += '<div class="slds-select_container">';
        datasetsdd += '<select class="slds-select datasetsdd" id="' + dname + '">';
        datasetsdd += '<option value="">Please select</option>';
        //console.log(selectedOrg['datasets']);
        for (let dataset in selectedOrg['datasets']) {
            if (dname === selectedOrg['datasets'][dataset]['name']) {
                datasetsdd += '<option selected title="' + selectedOrg['datasets'][dataset]['name'] + '" value="' + selectedOrg['datasets'][dataset]['name'] + '">' + selectedOrg['datasets'][dataset]['label'] + ' (' + selectedOrg['datasets'][dataset]['folder']['label'] + ')</option>';
            } else {
                datasetsdd += '<option title="' + selectedOrg['datasets'][dataset]['name'] + '" value="' + selectedOrg['datasets'][dataset]['name'] + '">' + selectedOrg['datasets'][dataset]['label'] + ' (' + selectedOrg['datasets'][dataset]['folder']['label'] + ')</option>';
            }
        }
        datasetsdd += '</select></div><div>';
        return datasetsdd;
    }

    // function to prepare salesforce dbs dd and make db selected if db found in salesforce.
    function prepareDashboardsDropDown(dname, selectedOrg) {
        let dashboardsdd = '';
        dashboardsdd += '<div class="slds-form-element__control">';
        dashboardsdd += '<div class="slds-select_container">';
        dashboardsdd += '<select class="slds-select dashboardsdd" id="' + dname + '">';
        dashboardsdd += '<option value="">Please select</option>';
        for (let dashboard in selectedOrg['dashboards']) {
            if (dname === selectedOrg['dashboards'][dashboard]['name']) {
                dashboardsdd += '<option selected title="' + selectedOrg['dashboards'][dashboard]['name'] + '" value="' + selectedOrg['dashboards'][dashboard]['name'] + '">';
                dashboardsdd += selectedOrg['dashboards'][dashboard]['label'] + ' (' + selectedOrg['dashboards'][dashboard]['folder']['label'] + ')</option>';
            } else {
                dashboardsdd += '<option title="' + selectedOrg['dashboards'][dashboard]['name'] + '" value="' + selectedOrg['dashboards'][dashboard]['name'] + '">';
                dashboardsdd += selectedOrg['dashboards'][dashboard]['label'] + ' (' + selectedOrg['dashboards'][dashboard]['folder']['label'] + ')</option>';
            }
        }
        dashboardsdd += '</select></div><div>';
        return dashboardsdd;
    }

    // function to prepare salesforce images dd and make image selected if image found in salesforce.
    function prepareImagesDropDown(iname, selectedOrg) {
        let imagesdd = '';
        imagesdd += '<div class="slds-form-element__control">';
        imagesdd += '<div class="slds-select_container">';
        imagesdd += '<select class="slds-select imagesdd" id="' + iname + '">';
        imagesdd += '<option value="">Please select</option>';
        //console.log(selectedOrg['images']);
        for (let i = 0; i < selectedOrg['images'].length; i++) {
            if (iname === selectedOrg['images'][i].Title) {
                imagesdd += '<option selected title="' + selectedOrg['images'][i].Title + '" value="' + selectedOrg['images'][i].Title + '">';
                imagesdd += selectedOrg['images'][i].Title + '</option>';
            } else {
                imagesdd += '<option title="' + selectedOrg['images'][i].Title + '" value="' + selectedOrg['images'][i].Title + '">';
                imagesdd += selectedOrg['images'][i].Title + '</option>';
            }
        }
        imagesdd += '</select></div><div>';
        return imagesdd;
    }

    // function to prepare salesforce dataflows dd and make dataflow selected if dataflow found in salesforce.
    function prepareDataflowsDropDown(dataflowname, selectedOrg) {
        let dataflowsdd = '';
        dataflowsdd += '<div class="slds-form-element__control">';
        dataflowsdd += '<div class="slds-select_container">';
        dataflowsdd += '<select class="slds-select dataflowsdd" id="' + dataflowname + '">';
        dataflowsdd += '<option value="">Please select</option>';
        //console.log(selectedOrg['dataflows']);

        if (selectedOrg['home'] === false) {
            for (let i = 0; i < selectedOrg['dataflows'].length; i++) {
                let dataflow = selectedOrg['dataflows'][i];
                if (dataflowname in mappedDataFlows) {
                    if ((mappedDataFlows[dataflowname]['target']) && (mappedDataFlows[dataflowname]['target'] == dataflow.id)) {
                        dataflowsdd += '<option selected title="' + dataflow.label + '" value="' + dataflow.id + '">';
                        dataflowsdd += dataflow.label + '</option>';
                    } else {
                        dataflowsdd += '<option title="' + dataflow.label + '" value="' + dataflow.id + '">';
                        dataflowsdd += dataflow.label + '</option>';
                    }
                } else if (dataflowname === dataflow.label) {
                    dataflowsdd += '<option selected title="' + dataflow.label + '" value="' + dataflow.id + '">';
                    dataflowsdd += dataflow.label + '</option>';
                } else {
                    dataflowsdd += '<option title="' + dataflow.label + '" value="' + dataflow.id + '">';
                    dataflowsdd += dataflow.label + '</option>';
                }
            }
        } else {
            for (let i = 0; i < selectedOrg['dataflows'].length; i++) {
                let dataflow = selectedOrg['dataflows'][i];
                if (dataflowname in mappedDataFlows) {
                    if ((mappedDataFlows[dataflowname]['source']) && (mappedDataFlows[dataflowname]['source'] == dataflow.id)) {
                        dataflowsdd += '<option selected title="' + dataflow.label + '" value="' + dataflow.id + '">';
                        dataflowsdd += dataflow.label + '</option>';
                    } else {
                        dataflowsdd += '<option title="' + dataflow.label + '" value="' + dataflow.id + '">';
                        dataflowsdd += dataflow.label + '</option>';
                    }
                } else if (dataflowname === dataflow.label) {
                    dataflowsdd += '<option selected title="' + dataflow.label + '" value="' + dataflow.id + '">';
                    dataflowsdd += dataflow.label + '</option>';
                } else {
                    dataflowsdd += '<option title="' + dataflow.label + '" value="' + dataflow.id + '">';
                    dataflowsdd += dataflow.label + '</option>';
                }
            }
        }


        dataflowsdd += '</select></div><div>';
        return dataflowsdd;
    }

    let mappedDataFlows = {}; //mappedDataflowsofsalesforce
    // On change dataflow dd change closest targetdataflow attr name
    $('#dataflowsAccitem tbody').on('change', '.dataflowsdd', function () {
        let dataflowname = $(this).closest('tr').attr("dataflowname");
        $(this).closest('tr').attr("targetdataflowname", $(this).val());
        mappedDataFlows[dataflowname] = {};
        mappedDataFlows[dataflowname]['name'] = dataflowname;
        mappedDataFlows[dataflowname]['source'] = $(this).val();
        console.log(mappedDataFlows);
    });

    // On change dataflow dd change closest targetdataflow attr name
    $('#uploadDataflowsTargetAccitem tbody').on('change', '.dataflowsdd', function () {
        let dataflowname = $(this).closest('tr').attr("dataflowname");
        $(this).closest('tr').attr("targetdataflowname", $(this).val());
        mappedDataFlows[dataflowname]['target'] = $(this).val();
        console.log(mappedDataFlows);
    });


    // On change dataset dd change closest targetdataset attr name
    $('#datasetsAccitem tbody').on('change', '.datasetsdd', function () {
        $(this).closest('tr').attr("targetdatasetname", $(this).val());
    });

    // On change dashboard dd change closest targetdashboard attr name
    $('#linksAccitem tbody').on('change', '.dashboardsdd', function () {
        $(this).closest('tr').attr("targetdashboardname", $(this).val());
    });

    // On change image dd change closest targetimage attr name
    $('#imagesAccitem tbody').on('change', '.imagesdd', function () {
        $(this).closest('tr').attr("targetimagename", $(this).val());
    });



    // Function for selectAll button in links accordion to select dbs.
    $('#selectAllLinks').on('click', function () {
        let selectedSource = $('#selectedSource').val();
        let destSource = $("#destSource").val();
        if (selectedSource === 'salesforce') {
            $('#linksAccitem tbody tr').each(function () {
                let self = $(this);
                let dashboardid = self.attr('dashboardid');
                let obj = salesforcehome['dashboards'].find(o => o.id === dashboardid);
                if (obj['isSelected'] === false) {
                    obj['isSelected'] = true;
                }
                if (destSource === "anothersalesforceorg") {
                    addSFDashboardtoAccordionDestAnotherSFOrg(salesforcehome['dashboardsMetaData'][dashboardid]);
                }
                if (destSource === "salesforce") {
                    addSFDashboardtoAccordionDestSF(salesforcehome['dashboardsMetaData'][dashboardid]);
                }
                self.remove();
            });
            $('#page2').find('#linksAccitem').hide();

        } else if (selectedSource === 'github') {

            $('#linksAccitem tbody tr').each(function () {
                let self = $(this);
                let dashboardname = self.attr('targetdashboardname');
                let obj = salesforcehome['dashboards'].find(o => o.name == dashboardname);
                if (obj) {
                    let response = salesforcehome['dashboardsMetaData'][obj.id];
                    let dashboardrow = "<tr dashboardid='" + response.id + "' folderid='" + response.folder.id + "'>";
                    dashboardrow += "<td><div class='slds-truncate' title='" + response.label + "'>" + response.label + "</div></td>";
                    dashboardrow += "<td><div class='slds-truncate' title='" + response.folder.label + "'>" + response.folder.label + "</div></td></tr>";
                    $('#page2').find('#dashboardsAccitem tbody').append(dashboardrow);
                    self.hide();
                    github.linkedSalesForceDashboards[response.id] = response;
                }
            });

            $('#page2').find('#linksAccitem').hide();

        }
    });



    // Function for accordion show/hide
    $(".slds-accordion").on('click', '.slds-accordion__list-item .slds-accordion__summary', function (e) {
        e.preventDefault();
        let $this = $(this),
            closest = $this.closest('section');
        if (closest.hasClass('slds-is-open')) {
            closest.removeClass('slds-is-open');
            closest.find('img').addClass("accordionicon_inverse");
            closest.find('.slds-accordion__content').hide();
        } else {
            $(".slds-accordion .slds-accordion__list-item section").removeClass('slds-is-open');
            $(".slds-accordion .slds-accordion__list-item img").addClass('accordionicon_inverse');
            closest.toggleClass('slds-is-open');
            closest.find('.slds-accordion__content').show();
            closest.find('img').removeClass("accordionicon_inverse");
        }
    });



    // Copy to salesforce
    //Function for clone
    // Copy to salesforce if source is salesforce & dest is salesforce.
    // Copy to github if source is salesforce & dest is github.
    // Copy to salesforce if source is github.
    $('#clone').on('click', function () {

        document.getElementById("clone").disabled = true;
        let selectedSource = $('#selectedSource').val();
        let destSource = $('#destSource').val();

        if (selectedSource === 'salesforce') {
            if (destSource === 'salesforce') {

                copyDashboardsFromSFtoSF(salesforcehome);

            } else if (destSource === 'anothersalesforceorg') {

                //copyDashboardsFromSFtoAnotherSF(anothersalesforceorg);
                copyDataflowsFromSFtoAnotherSF(anothersalesforceorg);

            } else if (destSource === 'github') {

                $('#backdrop').addClass('slds-backdrop--open');
                $('#gitCommitMessageModal').addClass('slds-fade-in-open');

            } else if (destSource === 'githubTemplatize') {

                $('#backdrop').addClass('slds-backdrop--open');
                $('#gitCommitMessageModal').addClass('slds-fade-in-open');

            }
        } else if (selectedSource === 'github') {

            copyDashboardsFromGithubToSF(salesforcehome);

        }
        document.getElementById("clone").disabled = false;

    });

    //copy from salesforce to salesforce
    function copyDashboardsFromSFtoSF(selectedOrg) {
        let allPromises = [];
        let selected = $('#sfSelectDestAppList').find('a.selected');
        if (selected.length > 0) {
            let folderid = $('#sfSelectDestAppList').find('a.selected').attr('folderid');
            let len = salesforcehome['dashboards'].length;

            let filterObj = selectedOrg['dashboards'].filter(function (e) {
                return e.folder.id === folderid;
            });

            for (let i = 0; i < len; i++) {
                if ((salesforcehome['dashboards'][i]['isSelected'] === true) && (salesforcehome['dashboards'][i]['folder']['id'] != folderid)) {
                    let id = salesforcehome['dashboards'][i]['id']
                    let dashboard = deepCopy(salesforcehome['dashboardsMetaData'][id]);

                    let files = filterObj.filter(function (e) {
                        return e.label === dashboard.label;
                    });
                    if (files.length > 0) {
                        let milliseconds = new Date().getTime();
                        dashboard.label = dashboard.label + "" + milliseconds;
                    }
                    if (dashboardsNamesinQue.includes(dashboard['label'])) {
                        let milliseconds = new Date().getTime();
                        dashboard.label = dashboard.label + "" + milliseconds;
                    }
                    let req = cloneDashboardsToSalesForce(dashboard, folderid, selectedOrg);
                    allPromises.push(req);
                }
            }

            $.when.apply(null, allPromises).done(function () {
                dashboardsNamesinQue = [];
                $('#loader').hide();
                saveConfiguration();
            });

        } else {
            document.getElementById("clone").disabled = false;
            showErrorPopup("select a application");
        }
    }

    //copyDashboardsFrom SF to AnotherSForg
    function copyDataflowsFromSFtoAnotherSF(selectedOrg) {
        let allPromises = [];
        let downloadedDataflows = {};
        for (let dset in mappedDataFlows) {
            let obj = salesforcehome['dataflows'].find(o => o.id === mappedDataFlows[dset]['source']);
            let get =  downloaddataflow( obj['id']);
            get.done(function (response) {
                downloadedDataflows[obj.id] = response['result'];
            });
            allPromises.push(get);
            //console.log(obj);
            /*let get = fetchDataFromSf(salesforcehome, 'insights/internal_api/v1.0/esObject/workflow/' + obj['id'] + '/json');
            get.done(function (response) {
                downloadedDataflows[obj.id] = response['result'];
            });
            allPromises.push(get);*/
        }
        $.when.apply(null, allPromises).done(function () {
            //console.log(downloadedDataflows);
            uploadDataflowsFromSFtoAnotherSF(downloadedDataflows, selectedOrg);
        });
    }
    function downloaddataflow(id){
        let postdata = {};
        postdata.dataflowid = id;
        return  $.ajax({
            dataType: 'json',
            url: '/downloaddataflows',
            type: 'POST',
            data: postdata
        }).fail(function () {
            console.log("error");
        });
    }

    function uploadDataflowsFromSFtoAnotherSF(downloadedDataflows, selectedOrg) {
        let allPromises = [];
        for (let dset in mappedDataFlows) {
            let sourceid = mappedDataFlows[dset]['source'];
            let dataflowJson = downloadedDataflows[sourceid];
            let targetid = mappedDataFlows[dset]['target'];
            if (targetid) {
                for (let i = 0; i < dataflowJson.length; i++) {
                    let postdata = {};
                    postdata['workflowDefinition'] = dataflowJson[i]['workflowDefinition'];
                    let post = postDataflowAjax(targetid, postdata);
                    post.done(function (response) {
                        console.log(response)
                    });
                    allPromises.push(post);
                }
            }
        }
        $.when.apply(null, allPromises).done(function () {
            console.log("Uploading dataflows completed");
            mappedDataFlows = {};
            copyDashboardsFromSFtoAnotherSF(selectedOrg);
        });
    }
    function postDataflowAjax(id, postdata) {
        // Return the $.ajax promise
        return $.ajax({
            url: proxyurl + anothersalesforceorg['orgname'] + 'insights/internal_api/v1.0/esObject/workflow/' + id + '/json',
            dataType: 'json',
            type: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + anothersalesforceorg['session'],
                'Content-Type': 'application/json'
            },
            contentType: 'application/json',
            data: JSON.stringify(postdata),
            processData: false,
            success: function (data) {
                console.log("uploaded succesfully");
            },
            error: function (jqXhr, textStatus, errorThrown) {
                showErrorPopup(errorThrown);
                console.log(errorThrown);
            }
        });
    }
    function copyDashboardsFromSFtoAnotherSF(selectedOrg) {
        let allPromises = [];
        let selected = $('#sfSelectDestAppList').find('a.selected');
        if (selected.length > 0) {
            let folderid = $('#sfSelectDestAppList').find('a.selected').attr('folderid');
            let len = salesforcehome['dashboards'].length;

            let filterObj = selectedOrg['dashboards'].filter(function (e) {
                return e.folder.id === folderid;
            });

            for (let i = 0; i < len; i++) {
                if ((salesforcehome['dashboards'][i]['isSelected'] === true) && (salesforcehome['dashboards'][i]['folder']['id'] != folderid)) {
                    let id = salesforcehome['dashboards'][i]['id']
                    let dashboard = deepCopy(salesforcehome['dashboardsMetaData'][id]);

                    let files = filterObj.filter(function (e) {
                        return e.label === dashboard.label;
                    });
                    if (files.length > 0) {
                        let milliseconds = new Date().getTime();
                        dashboard.label = dashboard.label + "" + milliseconds;
                    }
                    if (dashboardsNamesinQue.includes(dashboard['label'])) {
                        let milliseconds = new Date().getTime();
                        dashboard.label = dashboard.label + "" + milliseconds;
                    }

                    if (dashboard['datasets']) {
                        let dsets = dashboard['datasets'];
                        let datasetslen = dsets.length;
                        for (let i = 0; i < datasetslen; i++) {
                            let attrval = $('#page2').find('#datasetsAccitem tbody tr[datasetname="' + dsets[i]['name'] + '"]').attr("targetdatasetname");
                            dashboard['datasets'][i]['name'] = attrval;
                        }
                    }

                    // logic to replace datasetname in steps.step.query and datasetsname in step datsets
                    $("#page2 #datasetsAccitem tbody tr").each(function () {
                        let self = $(this);
                        let datasetname = self.attr('datasetname');
                        let targetdatasetname = self.attr('targetdatasetname');
                        let regEx = new RegExp(datasetname, 'g');
                        if (dashboard['state'] && dashboard['state']['steps']) {
                            let steps = dashboard['state']['steps'];
                            for (let step in steps) {
                                let query = steps[step]['query'];
                                let replacedataset = selectedOrg['namespaceprefix'] + "" + targetdatasetname;
                                if (query && (typeof query === 'string')) {
                                    steps[step]['query'] = steps[step]['query'].replace(regEx, replacedataset);
                                }
                                if (query && (typeof query === 'object')) {
                                    if (steps[step]['query']['query'] && (typeof steps[step]['query']['query'] === 'string')) {
                                        steps[step]['query']['query'] = steps[step]['query']['query'].replace(regEx, targetdatasetname);
                                    }
                                }
                            }
                        }
                    });

                    if (dashboard['state'] && dashboard['state']['steps']) {
                        let steps = dashboard['state']['steps'];
                        for (let step in steps) {
                            let datasets = steps[step]['datasets'];
                            if (datasets) {
                                let dlen = datasets.length;
                                for (let j = 0; j < dlen; j++) {
                                    let attrval = $('#page2').find('#datasetsAccitem tbody tr[datasetname="' + datasets[j]['name'] + '"]').attr("targetdatasetname");
                                    if (attrval) {
                                        dashboard['state']['steps'][step]['datasets'][j]['name'] = attrval;
                                    }
                                }
                            }
                        }
                    }

                    if (dashboard['state'] && dashboard['state']['gridLayouts']) {
                        let gridLays = dashboard['state']['gridLayouts'], gridLayslen = gridLays.length;
                        for (let i = 0; i < gridLayslen; i++) {
                            if (gridLays[i]['style'] && gridLays[i]['style']['image']) {
                                let image = gridLays[i]['style']['image']
                                let attrval = $('#page2 #imagesAccitem tbody').find('tr[imagename="' + image.name + '"]').attr("targetimagename");
                                if (attrval) {
                                    dashboard['state']['gridLayouts'][i]['style']['image']['name'] = attrval;
                                }
                                dashboard['state']['gridLayouts'][i]['style']['image']['namespace'] = selectedOrg['namespaceprefix'].replace("__", "");
                            }
                        }
                    }

                    if (dashboard['state'] && dashboard['state']['widgets']) {
                        let widgets = dashboard['state']['widgets'];
                        for (let key in widgets) {
                            let widget = widgets[key];
                            if ((widget.parameters.destinationType) && (widget.parameters.destinationType === 'dashboard')) {
                                if (widget.parameters.destinationLink && widget.parameters.destinationLink.name) {
                                    let dname = widget.parameters.destinationLink.name;
                                    let attrval = $('#page2 #linksAccitem tbody').find('tr[dashboardname="' + dname + '"]').attr("targetdashboardname");
                                    if (attrval) {
                                        dashboard['state']['widgets'][key].parameters.destinationLink.name = attrval;
                                    }
                                    dashboard['state']['widgets'][key].parameters.destinationLink.namespace = selectedOrg['namespaceprefix'].replace("__", "");
                                }
                            }
                            if (widget.parameters.image) { //widget.type === "image"
                                let image = widget.parameters.image
                                let attrval = $('#page2 #imagesAccitem tbody').find('tr[imagename="' + image.name + '"]').attr("targetimagename");
                                if (attrval) {
                                    dashboard['state']['widgets'][key].parameters.image.name = attrval;
                                }
                                dashboard['state']['widgets'][key].parameters.image.namespace = selectedOrg['namespaceprefix'].replace("__", "");
                            }
                            if (widget.type === "text") {
                                if (widget.parameters && widget.parameters.text) {
                                    dashboard['state']['widgets'][key].parameters.text = widget.parameters.text.replace(/(&lt\;)/g, '<');
                                    dashboard['state']['widgets'][key].parameters.text = widget.parameters.text.replace(/(&gt\;)/g, '>');
                                }
                            }
                        }
                    }

                    let req = cloneDashboardsToSalesForce(dashboard, folderid, selectedOrg);
                    allPromises.push(req);
                }
            }


            $.when.apply(null, allPromises).done(function () {
                dashboardsNamesinQue = [];
                $('#loader').hide();
                saveConfiguration();
            });

        } else {
            document.getElementById("clone").disabled = false;
            showErrorPopup("select a application");
        }
    }

    //copy from github to salesforce
    function copyDashboardsFromGithubToSF(selectedOrg) {
        let allPromises = [],
            selected = $('#sfSelectDestAppList').find('a.selected');
        if (selected.length > 0) {
            let folderid = $('#sfSelectDestAppList').find('a.selected').attr('folderid'),
                filterObj = salesforcehome['dashboards'].filter(function (e) {
                    return e.folder.id === folderid;
                });
            for (let key in github['repos']) {
                loopFolder(github['repos'][key]['content']);
            }

            function loopFolder(content) {
                for (let key1 in content) {
                    let file = content[key1];

                    if ((file['attrs'].type == 'file') && (file['isSelected'] === true)) {

                        let dashboard = deepCopy(file['content']);
                        let existingDashboardsWithLabel = filterObj.filter(function (e) {
                            return e.label === dashboard['label'];
                        });

                        if (existingDashboardsWithLabel.length > 0) {
                            let milliseconds = new Date().getTime();
                            dashboard['label'] = dashboard['label'] + "" + milliseconds;
                        }

                        if (dashboardsNamesinQue.includes(dashboard['label'])) {
                            let milliseconds = new Date().getTime();
                            dashboard.label = dashboard.label + "" + milliseconds;
                        }

                        if (dashboard['datasets']) {
                            let dsets = dashboard['datasets'];
                            let datasetslen = dsets.length;
                            for (let i = 0; i < datasetslen; i++) {
                                let attrval = $('#page2').find('#datasetsAccitem tbody tr[datasetname="' + dsets[i]['name'] + '"]').attr("targetdatasetname");
                                dashboard['datasets'][i]['name'] = attrval;
                            }
                        }

                        // logic to replace datasetname in steps.step.query and datasetsname in step datsets
                        $("#page2 #datasetsAccitem tbody tr").each(function () {
                            let self = $(this);
                            let datasetname = self.attr('datasetname');
                            let targetdatasetname = self.attr('targetdatasetname');
                            let regEx = new RegExp(datasetname, 'g');
                            if (dashboard['state'] && dashboard['state']['steps']) {
                                let steps = dashboard['state']['steps'];
                                for (let step in steps) {
                                    let query = steps[step]['query'];
                                    let replacedataset = salesforcehome['namespaceprefix'] + "" + targetdatasetname;
                                    if (query && (typeof query === 'string')) {
                                        steps[step]['query'] = steps[step]['query'].replace(regEx, replacedataset);
                                    }
                                    if (query && (typeof query === 'object')) {
                                        if (steps[step]['query']['query'] && (typeof steps[step]['query']['query'] === 'string')) {
                                            steps[step]['query']['query'] = steps[step]['query']['query'].replace(regEx, targetdatasetname);
                                        }
                                    }
                                }
                            }
                        });

                        if (dashboard['state'] && dashboard['state']['steps']) {
                            let steps = dashboard['state']['steps'];
                            for (let step in steps) {
                                let datasets = steps[step]['datasets'];
                                if (datasets) {
                                    let dlen = datasets.length;
                                    for (let j = 0; j < dlen; j++) {
                                        let attrval = $('#page2').find('#datasetsAccitem tbody tr[datasetname="' + datasets[j]['name'] + '"]').attr("targetdatasetname");
                                        if (attrval) {
                                            dashboard['state']['steps'][step]['datasets'][j]['name'] = attrval;
                                        }
                                    }
                                }
                            }
                        }

                        if (dashboard['state'] && dashboard['state']['gridLayouts']) {
                            let gridLays = dashboard['state']['gridLayouts'], gridLayslen = gridLays.length;
                            for (let i = 0; i < gridLayslen; i++) {
                                if (gridLays[i]['style'] && gridLays[i]['style']['image']) {
                                    let image = gridLays[i]['style']['image']
                                    let attrval = $('#page2 #imagesAccitem tbody').find('tr[imagename="' + image.name + '"]').attr("targetimagename");
                                    if (attrval) {
                                        dashboard['state']['gridLayouts'][i]['style']['image']['name'] = attrval;
                                    }
                                    dashboard['state']['gridLayouts'][i]['style']['image']['namespace'] = salesforcehome['namespaceprefix'].replace("__", "");
                                }
                            }
                        }

                        if (dashboard['state'] && dashboard['state']['widgets']) {
                            let widgets = dashboard['state']['widgets'];
                            for (let key in widgets) {
                                let widget = widgets[key];
                                if ((widget.parameters.destinationType) && (widget.parameters.destinationType === 'dashboard')) {
                                    if (widget.parameters.destinationLink && widget.parameters.destinationLink.name) {
                                        let dname = widget.parameters.destinationLink.name;
                                        let attrval = $('#page2 #linksAccitem tbody').find('tr[dashboardname="' + dname + '"]').attr("targetdashboardname");
                                        if (attrval) {
                                            dashboard['state']['widgets'][key].parameters.destinationLink.name = attrval;
                                        }
                                        dashboard['state']['widgets'][key].parameters.destinationLink.namespace = salesforcehome['namespaceprefix'].replace("__", "");
                                    }
                                }
                                if (widget.parameters.image) { //widget.type === "image"
                                    let image = widget.parameters.image
                                    let attrval = $('#page2 #imagesAccitem tbody').find('tr[imagename="' + image.name + '"]').attr("targetimagename");
                                    if (attrval) {
                                        dashboard['state']['widgets'][key].parameters.image.name = attrval;
                                    }
                                    dashboard['state']['widgets'][key].parameters.image.namespace = salesforcehome['namespaceprefix'].replace("__", "");
                                }
                                if (widget.type === "text") {
                                    if (widget.parameters && widget.parameters.text) {
                                        dashboard['state']['widgets'][key].parameters.text = widget.parameters.text.replace(/(&lt\;)/g, '<');
                                        dashboard['state']['widgets'][key].parameters.text = widget.parameters.text.replace(/(&gt\;)/g, '>');
                                    }
                                }
                            }
                        }

                        let req = cloneDashboardsToSalesForce(dashboard, folderid, selectedOrg);
                        allPromises.push(req);

                    } else if (file['attrs'].type === 'dir') {
                        loopFolder(file['content']);
                    }
                }
            }

            for (let db in github.linkedSalesForceDashboards) {
                let dashboard = github.linkedSalesForceDashboards[db];
                if (dashboard['folder']['id'] != folderid) {
                    let existingDashboardsWithLabel = filterObj.filter(function (e) {
                        return e.label === dashboard.label;
                    });
                    if (existingDashboardsWithLabel.length > 0) {
                        let milliseconds = new Date().getTime();
                        dashboard.label = dashboard.label + "" + milliseconds;
                    }
                    let existingDashboardsWithName = filterObj.filter(function (e) {
                        return e.name === dashboard.name;
                    });
                    if (existingDashboardsWithName.length <= 0) {
                        let req = cloneDashboardsToSalesForce(dashboard, folderid, selectedOrg);
                        allPromises.push(req);
                    }
                }
            }

            $.when.apply(null, allPromises).done(function () {
                dashboardsNamesinQue = [];
                $('#loader').hide();
                location.reload();
            });
        } else {
            document.getElementById("clone").disabled = false;
            showErrorPopup("select a application");
        }
    }

    let dashboardsNamesinQue = [];

    //copy to salesforce
    function cloneDashboardsToSalesForce(dashboard, folderid, selectedOrg) {
        let postJson = {
            "folder": {
                "id": folderid
            }
        };
        if (dashboard['label']) {
            postJson['label'] = dashboard['label'];
            dashboardsNamesinQue.push(postJson['label']);
        }
        if (dashboard['state']) {
            postJson['state'] = dashboard['state'];
        }
        let steps = postJson.state.steps;
        for (let step in steps) {
            let datasets = steps[step]['datasets'];
            if (datasets) {
                let dlen = datasets.length;
                for (let j = 0; j < dlen; j++) {
                    let obj = Object.assign({}, datasets[j]);
                    datasets[j] = {};
                    datasets[j]['id'] = obj.id;
                    datasets[j]['name'] = obj.name;
                }
            }
        }

        console.log(postJson);

        let stringified = JSON.stringify(postJson);
        let newString = stringified.replace(/(&#92\;&quot\;)/g, '\\\\\\"');
        newString = newString.replace(/(&quot\;)/g, '\\\"');
        newString = newString.replace(/(&#92\;)/g, '\\\\');
        newString = newString.replace(/(&#39\;)/g, "\'");

        if (('folder' in postJson) && ('label' in postJson) && ('state' in postJson)) {

            return $.ajax({
                url: 'uploaddashboards',//proxyurl + selectedOrg['orgname'] + 'services/data/v41.0/wave/dashboards',
                dataType: 'json',
                type: 'post',
                contentType: 'application/json',//contentType: "application/json; charset=utf-8",
                data: newString, //JSON.stringify(postJson)
                processData: false,
                success: function (data, textStatus, jQxhr) {
                    console.log("cloned succesfully");
                },
                error: function (jqXhr, textStatus, errorThrown) {
                    showErrorPopup(errorThrown);
                    console.log(errorThrown);
                }
            });
        } else {
            console.log('not-executable');
        }

    }



    //Save Configuration

    function getAllsobjects() {
        /*return $.ajax(proxyurl + salesforcehome.orgname + salesforceBaseUrl + 'sobjects', {
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });*/
        $.ajax('/getallsobjects', {
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }
    function ajaxforcreatingtouchconfigobject(soapRequest) {
        return $.ajax({
            type: "POST",
            url: proxyurl + salesforcehome.orgname + 'services/Soap/m/42.0/00D7F000001bjDF',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("SOAPAction", "\"\"");
                xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            },
            contentType: "text/xml; charset=\"utf-8\"",
            data: soapRequest,
            crossDomain: true,
        });
    }

    function checkiftouchconfigobjectexists(saveconfig, loadConfig) {
        let get = getAllsobjects();
        get.done(function (response) {
            let configObjExists = response['sobjects'].find(sobj => sobj.name === packageNameSpacePrefix + "TouchConfiguration__c");
            if (!configObjExists) {
                //console.log("not exist");
                createtouchconfigobjectinorg(saveconfig, loadConfig);
            } else {
                //console.log(configObjExists);
                if (saveconfig === true) {
                    saveConfigurationShowModal();
                }
                if (loadConfig === true) {
                    loadAllSavedConfigurations();
                }
            }
        });
    }
    function createtouchconfigobjectinorg(saveconfig, loadConfig) {
        let soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
		<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:apex="http://soap.sforce.com/2006/08/apex" xmlns:cmd="http://soap.sforce.com/2006/04/metadata" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
		   <soapenv:Header>
			  <cmd:SessionHeader>
				 <cmd:sessionId>`+ salesforcehome['session'] + `</cmd:sessionId>
			  </cmd:SessionHeader>
		   </soapenv:Header>
		   <soapenv:Body>
			  <create xmlns="http://soap.sforce.com/2006/04/metadata">
				 <metadata xsi:type="CustomObject">
					<fullName>TouchConfiguration__c</fullName>
					<label>TouchConfiguration</label>
					<pluralLabel>TouchConfiguration</pluralLabel>
					<deploymentStatus>Deployed</deploymentStatus>
					<sharingModel>ReadWrite</sharingModel>
					<nameField>
					   <label>ID</label>
					   <type>AutoNumber</type>
					</nameField>
				 </metadata>
			  </create>
		   </soapenv:Body>
		</soapenv:Envelope>`;

        let get = ajaxforcreatingtouchconfigobject(soapRequest);
        get.done(function (response) {
            createfieldsfortouchconfigobject(saveconfig, loadConfig);
        });

    }
    function createfieldsfortouchconfigobject(saveconfig, loadConfig) {
        //<length>32000</length><type>LongTextArea</type>
        let soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
			<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:apex="http://soap.sforce.com/2006/08/apex" xmlns:cmd="http://soap.sforce.com/2006/04/metadata" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
				<soapenv:Header>
					<cmd:SessionHeader>
						<cmd:sessionId>`+ salesforcehome['session'] + `</cmd:sessionId>
					</cmd:SessionHeader>
				</soapenv:Header>
				<soapenv:Body>
					<create xmlns="http://soap.sforce.com/2006/04/metadata">
						<metadata xsi:type="CustomField">
							<fullName>`+ salesforcehome['namespaceprefix'] + `TouchConfiguration__c.ConfigName__c</fullName>
							<label>ConfigName</label>
							
							<type>TextArea</type>
						</metadata>
						<metadata xsi:type="CustomField">
							<fullName>`+ salesforcehome['namespaceprefix'] + `TouchConfiguration__c.ConfigValue__c</fullName>
							<label>ConfigValue</label>
							
							<type>TextArea</type>
						</metadata>
					</create>
				</soapenv:Body>
			</soapenv:Envelope>`;

        let get = ajaxforcreatingtouchconfigobject(soapRequest);
        get.done(function (response) {
            checkIfTouchPermissionSetExist();
            console.log(response);
            if (saveconfig === true) {
                saveConfigurationShowModal();
            }
            if (loadConfig === true) {
                loadAllSavedConfigurations();
            }
        });
    }

    ///Permission Sets Functionality Begin
    var TouchPermissionSetId;
    // Check if permission set exists else create new permission set.

    function checkIfTouchPermissionSetExist() {
        $.ajax('/checkiftouchpermissionsetexists', {
            // beforeSend: function (xhr) {
            //     xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            // },
            success: function (response) {
                console.log(response);
                if (response['records'].length <= 0) {
                    getUserLicenseId();
                } else {
                    TouchPermissionSetId = response['records'][0]['Id'];
                    getFieldPermissionsParentId();
                }
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }

    var AnalyticsCloudIntegrationUserId;
    function getFieldPermissionsParentId() {
        $.ajax('/getFieldPermissionsParentId',{
            //proxyurl + salesforcehome.orgname + salesforceBaseUrl + "query/?q=SELECT+Id+FROM+PermissionSet+WHERE+Profile.Name+=+'System+Administrator'", {
            // beforeSend: function (xhr) {
            //     xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            // },
            //async: false,
            success: function (response) {
                AnalyticsCloudIntegrationUserId = response.records[0].Id;
                TouchPermissionSetId = response.records[0].Id;
                getPermissionSets();
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }
    var appPermissionFieldsArray = [];
    function getPermissionSets() {
        $.ajax(proxyurl + salesforcehome.orgname + salesforceBaseUrl + "query/?q=SELECT+Field,Id+FROM+FieldPermissions+WHERE+(ParentId+=+'" + TouchPermissionSetId + "'+OR+ParentId+='" + AnalyticsCloudIntegrationUserId + "')", {
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            },
            success: function (response) {
                appPermissionFieldsArray = [];
                response['records'].map(obj => { return appPermissionFieldsArray.push(obj.Field); });
                //console.log(appPermissionFieldsArray);
                createFieldPermissions();
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }
    // Create Permission set and create permission set assignment get permission set id.
    var profileId;
    var userLicenseId;
    var userId;
    function getUserLicenseId() {
        $.ajax(proxyurl + salesforcehome.orgname + salesforceBaseUrl + "query/?q=SELECT+Id,Name,UserLicenseId+FROM+Profile+WHERE+Name+=+'System Administrator'", {
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            },
            success: function (response) {
                userLicenseId = response['records'][0]['UserLicenseId'];
                profileId = response['records'][0]['Id'];
                getUserId(response['records'][0]['Id']);
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }
    function getUserId(pid) {
        $.ajax(proxyurl + salesforcehome.orgname + salesforceBaseUrl + "query/?q=SELECT+Id+FROM+User+WHERE+ProfileId+=+'" + pid + "'", {
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            },
            success: function (response) {
                userId = response['records'][0]['Id'];

                createPermissionSet();
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }
    function createPermissionSet() {
        let postData = {};
        postData["LicenseId"] = userLicenseId;
        postData["Label"] = "Admin Permission Sets";
        postData["Name"] = "Admin_Permission_Sets";
        postData["Description"] = "grant access to touch dataflow fields";


        $.ajax(proxyurl + salesforcehome.orgname + salesforceBaseUrl + "sobjects/PermissionSet", {
            type: "POST",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            },
            data: JSON.stringify(postData),
            dataType: 'json',
            contentType: 'application/json',
            success: function (response) {

                if (response.success === true) {
                    createPermissionSetAssignment(response.id);
                }
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }
    function createPermissionSetAssignment(pSid) {
        let postData = {};
        postData["AssigneeId"] = userId;
        postData["PermissionSetId"] = pSid;

        $.ajax(proxyurl + salesforcehome.orgname + salesforceBaseUrl + "sobjects/PermissionSetAssignment", {
            type: "POST",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            },
            data: JSON.stringify(postData),
            dataType: 'json',
            contentType: 'application/json',
            success: function (response) {
                TouchPermissionSetId = response.Id;
                createFieldPermissions();
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }
    function createFieldPermissions() {
        $("#loader").show();

        let postJson = {};
        postJson['records'] = [];


        let obj = {};
        obj['attributes'] = { "type": "FieldPermissions", "referenceId": packageNameSpacePrefix + 'TouchConfiguration__c.' + packageNameSpacePrefix + 'ConfigName__c' };
        obj['Field'] = packageNameSpacePrefix + 'TouchConfiguration__c.' + packageNameSpacePrefix + 'ConfigName__c';
        obj['ParentId'] = TouchPermissionSetId;
        obj['PermissionsEdit'] = false;
        obj['PermissionsRead'] = true;
        obj['SobjectType'] = packageNameSpacePrefix + 'TouchConfiguration__c';
        postJson['records'].push(obj);

        let obj1 = {};
        obj1['attributes'] = { "type": "FieldPermissions", "referenceId": packageNameSpacePrefix + 'TouchConfiguration__c.' + packageNameSpacePrefix + 'ConfigValue__c' };
        obj1['Field'] = packageNameSpacePrefix + 'TouchConfiguration__c.' + packageNameSpacePrefix + 'ConfigValue__c';
        obj1['ParentId'] = TouchPermissionSetId;
        obj1['PermissionsEdit'] = false;
        obj1['PermissionsRead'] = true;
        obj1['SobjectType'] = packageNameSpacePrefix + 'TouchConfiguration__c';
        postJson['records'].push(obj1);

        createPermissionsRestCall(postJson, 0);
    }
    function createPermissionsRestCall(postJson, attemptNo) {
        $.ajax({
            url: proxyurl + salesforcehome.orgname + salesforceBaseUrl + "composite/tree/FieldPermissions",
            dataType: 'json',
            type: 'post',
            headers: {
                'Authorization': 'Bearer ' + salesforcehome['session']
            },
            contentType: 'application/json',
            data: JSON.stringify(postJson),
            processData: false,
            success: function (response) {
                console.log("Created Permisssions Succesfully");
                $("#loader").hide();
            },
            error: function (jqXhr, textStatus, errorThrown) {
                console.log(jqXhr.responseText);
                $("#loader").hide();
            }
        });
    }


    //checkiftouchconfigobjectexists();
    function saveConfiguration() {
        $('#backdrop').addClass('slds-backdrop--open');
        $('#confirmSaveConfigModal').addClass('slds-fade-in-open');
    }

    $('#confirmSaveConfigModalBtn').on('click', function () {
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#confirmSaveConfigModal').removeClass('slds-fade-in-open');
        checkiftouchconfigobjectexists(true, false);
    });

    $('#closeConfirmSaveConfigModal').on('click', function () {
        location.reload();
    });

    function saveConfigurationShowModal() {
        $('#backdrop').addClass('slds-backdrop--open');
        $('#saveConfigurationModal').addClass('slds-fade-in-open');
    }

    $('#saveConfigurationBtn').on('click', function () {
        let configObj = {},
            cname = $("input#configname").val();
        if (cname === "") {
            $('#saveConfigurationModal .errorMessages').html('<p>Name is required</p>');
            $("input#configname").focus();
            return false;
        }
        configObj['salesforce'] = [];
        let len = salesforcehome['dashboards'].length;
        for (let i = 0; i < len; i++) {
            if ((salesforcehome['dashboards'][i]['isSelected'] === true)) {
                configObj['salesforce'].push(salesforcehome['dashboards'][i].id);
            }
        }
        let postObj = {};
        postObj[packageNameSpacePrefix + "ConfigName__c"] = cname;
        postObj[packageNameSpacePrefix + "ConfigValue__c"] = JSON.stringify(configObj['salesforce']);
        $.ajax({
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + salesforcehome['session']);
            },
            type: "POST",
            url: proxyurl + salesforcehome.orgname + salesforceBaseUrl + 'sobjects/' + packageNameSpacePrefix + 'TouchConfiguration__c',
            data: JSON.stringify(postObj),
            dataType: 'json',
            contentType: "application/json",
            success: function (res) {
                if (res.success === true) {
                    //console.log("new record created with id " + res.id);
                    location.reload();
                } else {
                    $('#saveConfigurationModal .errorMessages').html('<p>Failed to create record </p>');
                    console.log("failed to create record " + result[0]);
                }
            },
            error: function (error) {
                $('#saveConfigurationModal .errorMessages').html('<p>An error has occurred ' + error + '</p>');
                console.log("failed to create record " + error);
            }
        });
        /*let config = new sforce.SObject(packageNameSpacePrefix + "TouchConfiguration__c");
        config[packageNameSpacePrefix + "ConfigName__c"] = cname;
        config[packageNameSpacePrefix + "ConfigValue__c"] = JSON.stringify(configObj['salesforce']);
        sforce.connection.create([config], {
            onSuccess: function (result) {
                if (result[0].getBoolean("success")) {
                    console.log("new record created with id " + result[0].id);
                    location.reload();
                } else {
                    $('#saveConfigurationModal .errorMessages').html('<p>Failed to create record </p>');
                    console.log("failed to create record " + result[0]);
                }
            }, onFailure: function (error) {
                $('#saveConfigurationModal .errorMessages').html("An error has occurred " + error);
            }
        });*/
    });

    $('#closeSaveConfigurationModal').on('click', function () {
        location.reload();
    });



    // Copy to github

    $('#commit').on('click', function () {
        $('#backdrop').addClass('slds-backdrop--open');
        $('#gitCommitMessageModal').addClass('slds-fade-in-open');
    });

    $('#gitCommitMessageModalBtn').on('click', function () {
        document.getElementById("gitCommitMessageModalBtn").disabled = true;
        let commitMessage = $("input#commitMessage").val();
        if (commitMessage === "") {
            $('#gitCommitMessageModal .errorMessages').html('<p>Commit Message is required</p>');
            $("input#commitMessage").focus();
            document.getElementById("gitCommitMessageModalBtn").disabled = false;
            return false;
        }
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#gitCommitMessageModal').removeClass('slds-fade-in-open');
        copyDashboardsFromSfToGithub(commitMessage);
        document.getElementById("gitCommitMessageModalBtn").disabled = false;
    });

    $('#closeGitCommitMessageModal').on('click', function () {
        $('#backdrop').removeClass('slds-backdrop--open');
        $('#gitCommitMessageModal').removeClass('slds-fade-in-open');
    });

    let copyFromSfToGithubQue = [];

    function copyDashboardsFromSfToGithub(commitMessage) {
        let selectedpath = github['selectedDestFolderPath'];
        if (github['selectedDestRepo'] != null) {
            let allPromises = [], len = salesforcehome['dashboards'].length;
            $('#backdrop').addClass('slds-backdrop--open');
            let dbstocommit = [];

            let destSource = $('#destSource').val();

            for (let i = 0; i < len; i++) {
                if (salesforcehome['dashboards'][i]['isSelected'] === true) {
                    let id = salesforcehome['dashboards'][i]['id']
                    let dashboard = salesforcehome['dashboardsMetaData'][id];
                    let filename = dashboard.label + ".json";
                    if (copyFromSfToGithubQue.includes(filename)) {
                        let milliseconds = new Date().getTime();
                        filename = dashboard.label + "" + milliseconds + ".json";
                    }
                    copyFromSfToGithubQue.push(filename);

                    let templatizeddb = deepCopy(dashboard);
                    if (destSource === "githubTemplatize") {
                        templatizeddb = templatizeDashboard(dashboard);
                    }

                    //let templatizeddb = templatizeDashboard(dashboard);
                    let fileobj = {
                        path: selectedpath + filename,
                        content: JSON.stringify(templatizeddb, null, 2)
                    };
                    dbstocommit.push(fileobj);
                }
            }

            let req = commit(dbstocommit, commitMessage);
            allPromises.push(req);
            $.when.apply(null, allPromises).done(function () {
                copyFromSfToGithubQue = [];
                $('#backdrop').removeClass('slds-backdrop--open');
                saveConfiguration();
            });
        } else {
            document.getElementById("clone").disabled = false;
            showErrorPopup("select a folder");
        }
    }

    function iterateDashboardJson(obj) {
        for (let property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (typeof obj[property] === "object") {
                    iterateDashboardJson(obj[property]);
                } else {
                    if (typeof obj[property] === "string") {

                        let arr = obj[property].match(/(load)(\s|$)(&#92\;)(&quot\;)([^;]*)(?=&#92\;&quot\;)/g);
                        if (arr) {
                            for (let k = 0; k < arr.length; k++) {
                                let nval = arr[k];
                                nval = nval.replace(/(load)(\s|$)(&#92\;)(&quot\;)/g, '');
                                obj[property] = obj[property].replace(arr[k], "load &#92\;&quot\;${App.EdgeMarts." + nval + ".Alias}");
                            }
                        }

                        obj[property] = obj[property].replace(/(&#39\;)/g, "\'")
                        obj[property] = obj[property].replace(/(&#92\;&quot\;)/g, '\\\"');
                        obj[property] = obj[property].replace(/(&quot\;)/g, '\"');
                        obj[property] = obj[property].replace(/(&#92\;)/g, '\\');
                        obj[property] = obj[property].replace(/(&lt\;)/g, '<');
                        obj[property] = obj[property].replace(/(&gt\;)/g, '>');

                    }
                }
            }
        }
        return obj;
    }

    function templatizeDashboard(dashboard) {
        if (dashboard.datasets) {
            let dlen = dashboard.datasets.length;
            if (dlen > 0) {
                for (let j = 0; j < dlen; j++) {
                    let obj = Object.assign({}, dashboard['datasets'][j]);
                    dashboard['datasets'][j] = {};
                    if (dashboard['datasets'][j]['namespace']) {
                        let name = obj.name;
                        name = name.replace(datasets[j]['namespace'] + "_", ''); // Remove the first one
                    }
                    dashboard['datasets'][j]['name'] = "${App.EdgeMarts." + obj.name + ".Alias}";
                }
            }
        }

        if (dashboard.folder) {
            dashboard.folder = {
                "id": "${App.Folder.Id}"
            }
        }

        if (dashboard.state && dashboard.state.steps) {
            let steps = dashboard.state.steps;
            for (let step in steps) {
                let datasets = steps[step]['datasets'];
                if (datasets) {
                    let dlen = datasets.length;
                    for (let j = 0; j < dlen; j++) {
                        let obj = Object.assign({}, datasets[j]);
                        datasets[j] = {};
                        if (datasets[j]['namespace']) {
                            let name = obj.name;
                            name = name.replace(datasets[j]['namespace'] + "_", ''); // Remove the first one
                        }
                        datasets[j]['name'] = "${App.EdgeMarts." + obj.name + ".Alias}";
                    }
                }
            }
        }

        return iterateDashboardJson(dashboard);
    }


    // Github commit functions start.
    var head;
    function commit(files, message) {
        return Promise.all(files.map(function (file) {
            return createblob(file);
        })).then(function (blobs) {
            return fetchTree().then(function (tree) {
                return createTree({
                    tree: files.map(function (file, index) {
                        return {
                            path: file.path,
                            mode: '100644',
                            type: 'blob',
                            sha: blobs[index].sha
                        }
                    }),
                    basetree: tree.sha
                });
            });
        }).then(function (tree) {
            return createCommit({
                message: message,
                tree: tree.sha,
                parents: [
                    head.object.sha
                ]
            });
        }).then(function (commit) {
            return updateHead({
                sha: commit.sha
            });
        });
    }

    function createblob(file) {
        return $.ajax({
            url: github['domain'] + "/repos/" + github['user'].login + "/" + github['selectedDestRepo'] + "/git/blobs",
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(file),
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(github['username'] + ":" + github['password']));
            },
            //success: function (data) {
            //console.log(data);
            //},
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }

    function fetchHead() {
        return $.ajax({
            url: github['domain'] + "/repos/" + github['user'].login + "/" + github['selectedDestRepo'] + "/git/refs/heads/" + github['repos'][github['selectedDestRepo']]['branch'],
            dataType: 'json',
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(github['username'] + ":" + github['password']));
            },
            success: function (data) {
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }

    function fetchTree() {
        return fetchHead().then(function (commit) {
            head = commit;
            return $.ajax({
                url: head['object']['url'],
                dataType: 'json',
                success: function (data) {
                    head['tree'] = { 'sha': data['sha'] }
                }, error: function (jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR.status + ': ' + errorThrown);
                }
            });
        });
    }

    function createTree(tree) {
        let data = {
            "base_tree": tree.basetree,
            "tree": tree.tree
        };
        return $.ajax({
            url: github['domain'] + "/repos/" + github['user'].login + "/" + github['selectedDestRepo'] + "/git/trees",
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(github['username'] + ":" + github['password']));
            },
            success: function (data) {
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }

    function createCommit(obj) {
        let data = {
            "message": obj.message,
            "parents": obj.parents,
            "tree": obj.tree
        };
        return $.ajax({
            url: github['domain'] + "/repos/" + github['user'].login + "/" + github['selectedDestRepo'] + "/git/commits",
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(github['username'] + ":" + github['password']));
            },
            success: function (data) {
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }

    function updateHead(obj) {
        let data = {
            "sha": obj.sha
        };
        return $.ajax({
            url: github['domain'] + "/repos/" + github['user'].login + "/" + github['selectedDestRepo'] + "/git/refs/heads/" + github['repos'][github['selectedDestRepo']]['branch'],
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader('Authorization', 'Basic ' + window.btoa(github['username'] + ":" + github['password']));
            },
            success: function (data) {
            }, error: function (jqXHR, textStatus, errorThrown) {
                console.log(jqXHR.status + ': ' + errorThrown);
            }
        });
    }
    // Github commit functions end.



    // Download dashboards as zip file
    $('#download').on('click', function () {
        let zip = new JSZip();
        let dashboardsfolder = zip.folder("dashboards");
        let dataflowsfolder = zip.folder("dataflows");
        let dbnames = [];

        let len = salesforcehome['dashboards'].length;
        let destSource = $('#destSource').val();

        for (let i = 0; i < len; i++) {
            if ((salesforcehome['dashboards'][i]['isSelected'] === true)) {
                let id = salesforcehome['dashboards'][i]['id'];

                let dashboard = deepCopy(salesforcehome['dashboardsMetaData'][id]);
                if (destSource === "downloadTemplatize") {
                    dashboard = templatizeDashboard(dashboard);
                }

                if (dbnames.indexOf(dashboard.label) === -1) {
                    dashboardsfolder.file(dashboard.label + ".json", JSON.stringify(dashboard, null, 2));
                } else {
                    let milliseconds = new Date().getTime();
                    dashboard.label = dashboard.label + "" + milliseconds;
                    dashboardsfolder.file(dashboard.label + ".json", JSON.stringify(dashboard, null, 2));
                }
                dbnames.push(dashboard.label);
            }
        }

        let allPromises = [];
        for (let dset in mappedDataFlows) {
            let obj = salesforcehome['dataflows'].find(o => o.id === mappedDataFlows[dset]['source']);
            //console.log(obj);
            /*let get = fetchDataFromSf(salesforcehome, 'insights/internal_api/v1.0/esObject/workflow/' + obj['id'] + '/json');
            get.done(function (response) {
                for (let i = 0; i < response['result'].length; i++) {
                    dataflowsfolder.file(obj.label + ".json", JSON.stringify(response['result'][i]['workflowDefinition'], null, 2));
                }
            });
            allPromises.push(get);*/
            let get =  downloaddataflow(obj['id']);
            get.done(function (response) {
                for (let i = 0; i < response['result'].length; i++) {
                    dataflowsfolder.file(obj.label + ".json", JSON.stringify(response['result'][i]['workflowDefinition'], null, 2));
                }
            });
            allPromises.push(get);
        }
        $.when.apply(null, allPromises).done(function () {

            zip.generateAsync({ type: "blob" })
                .then(function (content) {
                    // see FileSaver.js
                    saveAs(content, "dashboards.zip");
                });

        });


    });

    function deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj))
    }














    $('#back').on('click', function () {
        $('#page2').find('#dashboardsAccitem tbody').empty();
        $('#page2').find('#datasetsAccitem tbody').empty();
        $('#page2').find('#linksAccitem tbody').empty();
        $('#page2').find('#imagesAccitem tbody').empty();
        $('#page2').find('#dataflowsAccitem tbody').empty();
        $('#page2').find('#uploadDataflowsTargetAccitem tbody').empty();


        $("#page1").show();
        $("#page2").hide();
        $("#back").hide();
        $("#next").show();
        $("#clone").hide();
        $("#commit").hide();
        $('#download').hide();
        $("#selectedSourceContainer").show();
        $("#destSourceContainer").hide();
        mappedDataFlows = {};

        $('#page2').find('#imagesAccitem').hide();
        $('#page2').find('#linksAccitem').hide();
        $('#page2').find('#dataflowsAccitem').hide();
        $('#page2').find('#uploadDataflowsTargetAccitem').hide();
        currentPage = 1;
    });

    //Filter lists
    $(document).on('keyup', ".myInput", function (event) {
        let value = $(this).val();
        let filter = value.toUpperCase();
        $(this).parent().parent().find(".selectors a").each(function (index) {
            let a = $(this).find('label').html();
            if (a != undefined) {
                if (a.toUpperCase().indexOf(filter) > -1) {
                    $(this).css("display", "");
                } else {
                    $(this).css("display", "none");
                }
            }
        });
    });

    //Error Pop up
    function showErrorPopup(errorMessage) {
        $('#errorpopup #errormessage').text(errorMessage);
        $('#errorpopup').show();
    }

    $('#errorpopup #errorpopupclose').on('click', function () {
        $('#errorpopup #errormessage').text('');
        $('#errorpopup').hide();
    });

});