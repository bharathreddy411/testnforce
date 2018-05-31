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
        self.userId;
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
            for(let i = 0; i < folLen; i++) {
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
        console.log('under dev');
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




    function prepareGithubDestList(){

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