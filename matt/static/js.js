/*
* MATT - A Framework For Modifying And Testing Topologies
* Copyright (C) 2021-2023 Jeff Raffael Gower
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * Main function that runs after the document is ready
 */
$(function () {
    // TODO check all lets and maybe make them consts
    // TODO check all variables and maybe make them lets or consts or back to var?
    let maxHeight = $(window).height();
    let maxWidth = $(window).width();
    let maxX;
    let maxY;
    let svg;
    let trees;
    let snapshotTrees = [];
    let g;
    let buttons_activated = false;
    let counter_of_trees = 0;
    let found = null;
    let context_id;
    let clicked_id;
    let hoveredPath;
    let clickedPath;
    let nameText;
    let interval;
    let enableLengths;
    let alignLabels = true;
    let collapsedmap = {};

    // Gets the options initially
    getOptions();

    // The options and help buttons have to be activated here, since they should always work
    $("#options-button").click(function (event) {
        $("#options-modal").modal("show");
    });
    $("#context-options").click(function (event) {
        $("#context-menu").removeClass("visible");
        $("#options-modal").modal("show");
    });

    $("#help-button").click(function (event) {
        window.open("https://github.com/BIONF/MATT/blob/master/README.md", target="_blank");
    });
    $("#context-help").click(function (event) {
        $("#context-menu").removeClass("visible");
        window.open("https://github.com/BIONF/MATT/blob/master/README.md", target="_blank");
    });

    // Draws the instructions on the screen before an import happened
    drawInstructions(maxWidth, maxHeight);

    /**
     * Handles the alignment and/or tree file after the import button has been clicked
     */
    $("#import").click(function () {
        // TODO
        /*if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
          alert('The File APIs are not fully supported in this browser.');
          return;
        }

        input = document.getElementById('fileinput');
        if (!input) {
          alert("Um, couldn't find the fileinput element.");
        }
        else if (!input.files) {
          alert("This browser doesn't seem to support the `files` property of file inputs.");
        }
        else if (!input.files[0]) {
          alert("Please select a file before clicking 'Load'");
        } else {*/

        // Instantiates variables
        let sessionName = $("#session-name").val();

        let alignmentFile = $("#alignment-file")[0].files[0];
        let treeFile = $("#tree-file")[0].files[0];

        let alignmentReader;
        let treeReader;

        let senddataAlignment;
        let senddataTree;

        // Gets the data from the alignment file and calls the sendAlignmentAndTree function
        if (typeof alignmentFile !== "undefined") {
            senddataAlignment = {
                name: alignmentFile.name,
                date: alignmentFile.lastModified,
                size: alignmentFile.size,
                type: alignmentFile.type
            }
            alignmentReader = new FileReader();
            alignmentReader.onload = function (theFileData) {
                senddataAlignment.fileData = theFileData.target.result;
                sendAlignmentAndTree();
            }
            alignmentReader.readAsDataURL(alignmentFile);
        }

        // Gets the data from the tree file and calls the sendAlignmentAndTree function
        if (typeof treeFile != "undefined") {
            senddataTree = {
                name: treeFile.name,
                date: treeFile.lastModified,
                size: treeFile.size,
                type: treeFile.type
            }
            treeReader = new FileReader();
            treeReader.onload = function (theFileData) {
                senddataTree.fileData = theFileData.target.result;
                sendAlignmentAndTree();
            }
            treeReader.readAsDataURL(treeFile);
        }

        /**
         * Sends the alignment and/or tree to the backend
         */
        function sendAlignmentAndTree() {
            // Shows different modals for user feedback and sends different data depending on the imported files
            if ((typeof alignmentFile !== "undefined") && (typeof treeFile !== "undefined")) {
                if ((typeof senddataAlignment.fileData !== "undefined") && (typeof senddataTree.fileData !== "undefined")) {
                    // Shows the info modal
                    $("#info-modal-label").text("Import started!");
                    $("#info-modal-body").text("The sequence alignment was saved and the tree is drawn!");
                    $("#info-modal").modal("show");
                    // Sends the data to the backend
                    load("post", {
                        alignment: {
                            data: senddataAlignment.fileData,
                            name: senddataAlignment.name
                        },
                        tree: {
                            data: senddataTree.fileData,
                            name: senddataTree.name
                        },
                        session: sessionName
                    });
                }
            } else if ((typeof alignmentFile !== "undefined") && (typeof treeFile === "undefined")) {
                if (typeof senddataAlignment.fileData !== "undefined") {
                    // Shows the warning modal
                    $("#warning-modal-label").text("Only an alignment is provided!");
                    $("#warning-modal-body").text("Please also provide a tree file. Otherwise, MATT can calculate the ML-tree, which may take some time!");
                    $("#warning-modal-continue-button").text("Compute tree");
                    $("#warning-modal-cancel-button").text("Upload tree");
                    $("#warning-modal").modal("show");
                    // Shows the info modal if the continues button is clicked after the warning
                    $("#warning-modal-continue-button").click(function (event) {
                        $("#info-modal-label").text("Import started!");
                        $("#info-modal-body").text("The alignment was saved and the tree will be computed.");
                        $("#info-modal").modal("show");
                        // Sends the data to the backend
                        load("post", {
                            alignment: {
                                data: senddataAlignment.fileData,
                                name: senddataAlignment.name
                            },
                            session: sessionName
                        });
                        $("#warning-modal").modal("hide");
                    });
                    // Hides the warning modal if canceled
                    $("#warning-modal-cancel-button").click(function (event) {
                        $("#warning-modal").modal("hide");
                        $("#tree-file-button").trigger("click");
                    });
                }
            } else if ((typeof alignmentFile === "undefined") && (typeof treeFile !== "undefined")) {
                if (typeof senddataTree.fileData !== "undefined") {
                    // Shows the warning modal
                    $("#warning-modal-label").text("Only a tree is provided!");
                    $("#warning-modal-body").text("Please also provide an alignment file. Otherwise you cannot use MATT for topology testing!");
                    $("#warning-modal-continue-button").text("Display tree only");
                    $("#warning-modal-cancel-button").text("Upload alignment");
                    $("#warning-modal").modal("show");
                    // Shows the info modal if the continues button is clicked after the warning
                    $("#warning-modal-continue-button").click(function (event) {
                        $("#info-modal-label").text("Import started!");
                        $("#info-modal-body").text("The tree was saved and will be displayed. Tests are disabled! ");
                        $("#info-modal").modal("show");
                        // Sends the data to the backend
                        load("post", {
                            tree: {
                                data: senddataTree.fileData,
                                name: senddataTree.name
                            },
                            session: sessionName
                        });
                        $("#warning-modal").modal("hide");
                    });
                    // Hides the warning modal if canceled
                    $("#warning-modal-cancel-button").click(function (event) {
                        $("#warning-modal").modal("hide");
                        $("#alignment-file-button").trigger("click");
                    });
                }
            }
        }

        // }

    });

    let dnaProtein;

    /**
     * Switches to dna when a dna file has been detected
     */
    $("#dna").click(function () {
        $("#dna-options").show();
        $("#protein-options").hide();
        dnaProtein = "dna";
    });

    /**
     * Switches to protein when a protein file has been detected
     */
    $("#protein").click(function () {
        $("#protein-options").show();
        $("#dna-options").hide();
        dnaProtein = "protein";
    });

    /**
     * Requests the example tree
     */
    $("#example-import").click(function () {
        $("#dna").trigger("click");
        // Saves the options
        optionsJSON = {
            "working-directory": $("#working-directory").val()
        }
        if (dnaProtein == "dna") {
            optionsJSON["dna-protein"] = "dna";
            optionsJSON["dna-bsr"] = $("#selectBSR").val();
            optionsJSON["dna-bf"] = $("#selectBF").val();
            optionsJSON["dna-rhas"] = $("#selectDNARHAS").val();
        } else if (dnaProtein == "protein") {
            optionsJSON["dna-protein"] = "protein";
            optionsJSON["protein-aaerm"] = $("#selectAAERM").val();
            optionsJSON["protein-pmm"] = $("#selectPMM").val();
            optionsJSON["protein-aaf"] = $("#selectAAF").val();
            optionsJSON["protein-rhas"] = $("#selectAARHAS").val();
        }
        options(optionsJSON);
        // Sends the example request to the backend
        load("post", "example");
    });

    /**
     * Takes the options and sends them to the backend
     */
    $("#options-modal-button").click(function () {
        $("#options-modal").modal("hide");
        optionsJSON = {
            "working-directory": $("#working-directory").val()
        }
        if (dnaProtein == "dna") {
            optionsJSON["dna-protein"] = "dna";
            optionsJSON["dna-bsr"] = $("#selectBSR").val();
            optionsJSON["dna-bf"] = $("#selectBF").val();
            optionsJSON["dna-rhas"] = $("#selectDNARHAS").val();
        } else if (dnaProtein == "protein") {
            optionsJSON["dna-protein"] = "protein";
            optionsJSON["protein-aaerm"] = $("#selectAAERM").val();
            optionsJSON["protein-pmm"] = $("#selectPMM").val();
            optionsJSON["protein-aaf"] = $("#selectAAF").val();
            optionsJSON["protein-rhas"] = $("#selectAARHAS").val();
        }
        options(optionsJSON);
    });

    /**
     * Tests the selected snapshots by sending them to the backend
     */
    $("#snapshots-modal-button").click(function () {
        $("#snapshots-modal").modal("hide");
        var snapshots = [];
        $.each($("#snapshots input:checked"), function () {
            snapshots.push($(this).val());
        });
        if (snapshots.length != 0) {
            tests({
                "snapshots": snapshots
            });
        } else {
            // Shows the info modal
            $("#info-modal-label").text("No tree selected!")
            $("#info-modal-body").text("Please select at least one tree first!")
            $("#info-modal").modal("show");
        }
    });

    /**
     * Redraws the tree showing the branch lengths
     */
    $("#compute-modal-button").click(function () {
        if (!(enableLengths)) {
            load("get", {
                'lengths': "enabled"
            }); // TODO LOADING BAR
        }
    });

    /**
     * Gets the options from the backend and shows them in the options
     */
    function getOptions() {
        $.get("get-options", "", function (data) {
            data = JSON.parse(data);
            $("#working-directory").val(data["working_directory"])
            if (data["dna_protein"] == "dna") {
                dnaProtein = "dna";
                $("#dna").prop("checked", true);
                $("#protein").prop("checked", false);
                $("#dna-options").show();
                $("#protein-options").hide();
            } else if (data["dna_protein"] == "protein") {
                dnaProtein = "protein";
                $("#protein").prop("checked", true);
                $("#dna").prop("checked", false);
                $("#protein-options").show();
                $("#dna-options").hide();
            }
            $("#selectBSR").val(data["dna_bsr"]);
            $("#selectBF").val(data["dna_bf"]);
            $("#selectDNARHAS").val(data["dna_rhas"]);
            $("#selectAAERM").val(data["protein_aaerm"]);
            $("#selectPMM").val(data["protein_pmm"]);
            $("#selectAAF").val(data["protein_aaf"]);
            $("#selectAARHAS").val(data["protein_rhas"]);
        });
    }

    /**
     * Handles the requests to the load route
     * @param method post for import, get for rehanging and rerooting
     * @param httpData tree information
     */
    function load(method, httpData) {
        if (method == "post") {
            $.post("load", httpData, update);
        } else {
            $.get("load", httpData, update);
        }
    }

    /**
     * Updates the frontend after data has been received from the backend
     * @param data tree information
     * @param status http response code
     * @param xhr response itself for reading response headers
     */
    function update(data, status, xhr) {
        //alert("Data: " + data + "\nStatus: " + status);
        // TODO work with status?!
        if (data == "WRONG DATA") {
            // Shows the info modal
            $("#info-modal-label").text("Data mismatch!");
            $("#info-modal-body").text("The data you provided does not match. Either Alignment and Tree do not suit each other or you chose the wrong sequence type. Please reload and enter correct data.");
            $("#info-modal").modal("show");
            return;
        }
        data = JSON.parse(data);

        // Holds all the trees
        trees = data;

        // Holds the number of trees for the undoing and redoing
        number_of_trees = trees.length;

        if (typeof xhr !== "undefined") {
            counter_of_trees = parseInt(counter_of_trees);
            // Increase the number of trees only if there was not a call for branch lengths only
            if (!(xhr.getResponseHeader("Length"))) {
                counter_of_trees += 1;
            }
            // Enables or disables the testing option
            set_testing(xhr.getResponseHeader("Testing"));
        }




        // Enables the undo and redo buttons (depending on edge cases)
        if (counter_of_trees > 1) {
            $("#undo-button").prop("disabled", false);
        }
        if (counter_of_trees < number_of_trees) {
            $("#redo-button").prop("disabled", false);
        }
        if (counter_of_trees == number_of_trees) {
            $("#redo-button").prop("disabled", true);
        }

        // Saves the first snapshot
        // TODO This should be toggleable in options
        if (snapshotTrees.length == 0) {
            snapshotTrees.push(trees[counter_of_trees - 1]);
            description(trees[counter_of_trees - 1][0], "Original");
        }

        // Calls the draw function with the chosen tree (with or without branch lengths)
        if (typeof xhr !== "undefined" && xhr.getResponseHeader("Length")) {
            draw(JSON.parse(trees[counter_of_trees - 1][2]));
        } else {

            draw(JSON.parse(trees[counter_of_trees - 1][1]));
        }


    }



    /**
     * Enables or disables testing capabilities
     * @param testing whether testing should be enabled or not
     */
    function set_testing(testing) {
        if (testing == "enabled") {
            $("#snapshots-modal-button").prop("disabled", false);
            $("#testing-disabled-message").hide();
        } else if (testing == "disabled") {
            $("#snapshots-modal-button").prop("disabled", true);
            $("#testing-disabled-message").show();
        }
    }

    /**
     * Sends the selected options to the backend
     * @param data information on the options
     */
    function options(data) {
        $.post("options", data, function (response) {
            if (response == "Invalid directory") {
                // Shows the info modal
                $("#info-modal-label").text("Invalid working directory set!")
                $("#info-modal-body").text("Please select an existing working directory!")
                $("#info-modal").modal("show");
            }
        });
        // Reloads
        if (typeof trees !== "undefined") {
            load("get", null);
        }
    }

    /**
     * Sends the description to the backend and calls the update and snapshots functions
     * @param id the tree to be altered
     * @param description the new description
     */
    function description(id, description) {
        $.post("description", {"id": id, "description": description});
        trees.find(element => element[0] == id)[3] = description;
        snapshotTrees.find(element => element[0] == id)[3] = description;
        update(JSON.stringify(trees));
        snapshots(snapshotTrees);
    }

    /**
     * Gets the description, saves it and calls the description function
     */
    function save() {
        if (snapshotTrees.find(element => element[0] == trees[counter_of_trees - 1][0])) {
            // Shows the info modal
            $("#info-modal-label").text("This snapshot already exists!")
            $("#info-modal-body").text("This tree has already been snapshot.")
            $("#info-modal").modal("show");
            return;
        }
        descriptionValue = $("#snapshot-label").val();
        if (descriptionValue == "") {
            descriptionValue = trees[counter_of_trees - 1][0];
        }
        snapshotTrees.push(trees[counter_of_trees - 1]);
        description(trees[counter_of_trees - 1][0], descriptionValue);
    }

    /**
     * Updates the snapshots and displays them
     * @param data snapshot informations
     */
    function snapshots(data) {
        $("#no-entries").remove();
        $("#snapshots").empty();
        $("#snapshots").append('<thead><tr><th>Select for testing</th><th>Jump to</th><th>Change Name</th><th>Download</th></tr></thead>');
        $("#snapshots").append('<tbody>');
        data.forEach(function (value) {
            text = '<tr>';
            text += '<td class="snapshots-table-checkbox"><input type="checkbox" value="' + value[0] + '"></td>';
            text += '<td><button type="button" class="btn btn-link" id="snapshot-' + value[0] + '">' + ((value[3] != "") ? value[3] : value[0]) + '</button></td>';
            text += '<td><button type="button" class="btn btn-link" id="snapshot-edit-' + value[0] + '"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/></svg></button></td>';
            text += '<td><button type="button" class="btn btn-link" id="snapshot-download-' + value[0] + '"><svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-download" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg></button></td>';
            text += '</tr>';
            $("#snapshots").append(text);
            // Configures the link to jump to the chosen tree
            $("#snapshot-" + value[0]).click(function () {
                snapshotId = $(this).attr("id").split("-")[1];
                draw(JSON.parse(snapshotTrees.find(tree => tree[0] == snapshotId)[1]));
                $.get("reset/" + snapshotId);
                counter_of_trees = 1;
                number_of_trees = 1;
                $("#undo-button").prop("disabled", true);
                $("#redo-button").prop("disabled", true);
                update(JSON.stringify([snapshotTrees.find(tree => tree[0] == snapshotId)]));
            });
            // Configures the link to call the change modal for chosen tree
            $("#snapshot-edit-" + value[0]).click(function () {
                $("#snapshots-modal").modal("hide");
                snapshotId = $(this).attr("id").split("-")[2];
                $("#change-snapshot-label").val(value[3]);
                $("#change-modal").modal("show");
                $("#change-modal").on("shown.bs.modal", function () {
                    $("#change-snapshot-label").focus();
                });
                // TODO das muss eventuell vorher unbinded werden?
                $("#change-modal-button").click(function (event) {
                    var newValue = $("#change-snapshot-label").val();
                    description(snapshotId, newValue);
                    $("#change-modal").modal("hide");
                });
                $('#change-snapshot-label').keypress(function (event) {
                    if (event.which == '13') {
                        event.preventDefault();
                        var newValue = $("#change-snapshot-label").val();
                        description(snapshotId, newValue);
                        $("#change-modal").modal("hide");
                    }
                });
            });
            // Configures the link to download the chosen tree
            $("#snapshot-download-" + value[0]).click(function () {
                snapshotId = $(this).attr("id").split("-")[2];
                download(snapshotId);
            });
        });
        $("#snapshots").append('</tbody>');
    }

    /**
     * Requests the test results
     * @param data tree informations
     */
    function tests(data) {
        // Shows the info modal
        $("#info-modal-label").text("Tree topology testing started!")
        $("#info-modal-body").text("Tree topology testing in progress.")
        $("#info-modal-body").append('<div id="progress-bar-wrapper" class="progress"><div id="progress-bar" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"></div></div>');
        $("#info-modal").modal("show");

        ids = data["snapshots"];

        $.post("tests", data, function (data) {
            if (data == "NO") {
                // Shows the info modal
                $("#info-modal-label").text("Initial tree selected!")
                $("#info-modal-body").text("When selecting only one tree, please do not select the initially provided tree!")
                $("#info-modal").modal("show");
                return;
            }
            // Checks every 500ms (0,5s) for the progress of the requested test
            interval = window.setInterval(function () {
                check_test_progress(data);
            }, 500);
        });
    }

    /** Checks the progress of the test results and shows them when they are ready
     * @param data the id of the test job
     */
    function check_test_progress(data) {
        $.get("testsresults/" + data, "", function (data) {
            if(data == "NO") {
                window.clearInterval(interval);
                $("#progress-bar-wrapper").remove();
                // Shows the info modal
                $("#info-modal-label").text("Something went wrong!")
                $("#info-modal-body").text("Please try again!")
                $("#info-modal").modal("show");
                return;
            }
            // Updates the progress bar
            if (["20", "40", "60", "80", "100"].includes(data)) {
                $("#progress-bar").css("width", data + "%");
            } else {
                // Shows the test results after some cleanup
                window.clearInterval(interval);
                $("#progress-bar-wrapper").remove();

                $("#info-modal").modal("hide");

                data = JSON.parse(data);
                testPath = data.pop();

                $("#tests").empty();
                data.forEach(function (value, index) {
                    let row = '';
                    row += '<tr>';
                    if (ids.length == 1) {
                        if (index == 0) {
                            row += '<td>Original</td>';
                        } else {
                            row += '<td>' + snapshotTrees.find(element => element[0] == ids[0])[3] + '</td>';
                        }
                    } else {
                        row += '<td>' + snapshotTrees.find(element => element[0] == ids[index])[3] + '</td>';
                    }
                    row += '<td>' + parseFloat(value[1]).toFixed(2) + '</td>';
                    row += '<td>' + parseFloat(value[2]).toFixed(2) + '</td>';
                    row += '<td>' + value[3] + ' (' + value[4] + ')' + '</td>';
                    row += '<td>' + value[5] + ' (' + value[6] + ')' + '</td>';
                    row += '<td>' + value[7] + ' (' + value[8] + ')' + '</td>';
                    row += '<td>' + value[9] + ' (' + value[10] + ')' + '</td>';
                    row += '<td>' + value[11] + ' (' + value[12] + ')' + '</td>';
                    row += '<td>' + value[13] + ' (' + value[14] + ')' + '</td>';
                    row += '<td>' + value[15] + ' (' + value[16] + ')' + '</td>';
                    row += '</tr>';
                    $("#tests").append(row);
                });
                $("#test-path").empty();
                $("#test-path").append("The test results are also available under: \"" + testPath + "\"");
                $("#test-modal").modal("show");
                $('[data-toggle="popover"]').popover();
            }
        });
    }

    /**
     * Requests and downloads the given tree
     * @param id tree to download
     */
    function download(id) {
        $.get("download/" + id);
        window.open("download/" + id);
    }

    /**
     * Toggles displaying of the rerooting button
     */
    function toggleOutgroupButton() {
        if ($("#outgroup-button").css("display") == "none") {
            $("#outgroup-button").css("display", "block");
        } else if ($("#outgroup-button").css("display") == "block") {
            $("#outgroup-button").css("display", "none");
        }
    }

    /**
     * Draws the svg in the main div
     * @param data tree informations
     */
    function draw(data) {

        //const collapsedmap = {};
        if(Object.keys(collapsedmap).length === 0){
            data.forEach(n => {
            collapsedmap[n["id"]] = {left: false, right: false, left_id: null, right_id: null, label: "Collapsed",
                "l-d": null,"r-d":null, "l_edge-Y": null, "r_edge-Y": null, "collapsed-line-Y":null,
                "minimap-r-m": null, "minimap-l-m": null};
            });
        }


        $("#outgroup-button").css("display", "none");


        xBefore = getTransform("x");
        yBefore = getTransform("y");
        scaleBefore = getTransform("scale");

        $("#logo-main").remove();
        $("#logo-slide").remove();

        if (typeof svg !== "undefined") {
            svg.remove();
        }

        if (typeof minimap !== "undefined") {
            minimap.remove();
        }

        if (typeof instructions !== "undefined") {
            instructions.remove();
        }

        // Main svg holding all others
        svg = Snap(maxWidth, maxHeight);
        $(svg.node).appendTo($("#mainDiv"));

        // Some meta information for correct sizings
        extraData = data.pop();
        enableLengths = extraData["enable_lengths"];
        maxLength = extraData["max_length"];
        longestName = extraData["longest_name"];

        let fontSize = '1.375em';
        let strokeWidth = 4;

        // Calculates the width of the longest name in the tree
        longestNameTester = svg.text(0, 0, longestName).attr({
            fontSize: fontSize
        });
        longestNameWidth = Math.ceil(longestNameTester.getBBox().width);
        longestNameTester.remove();

        // TODO instead of checking longest name, we have to check longest combination of line with length and name for each and get longest total line

        amount = data.length;

        offset = 10;
        multiplier = enableLengths ? 10 : 1;
        //scaleX = 200;
        scaleX = 50 * multiplier;
        scaleY = 30;

        svg.remove();
        //svg = Snap(((scaleX * maxLength) + (2.5 * offset) + longestNameWidth), (scaleY * (amount + 1)));
        //$(svg.node).appendTo($("#mainDiv"));
        maxX = (scaleX * maxLength) + (3.5 * offset) + longestNameWidth;
        maxY = scaleY * (amount + 1);

        // Redraws the main svg
        svg = Snap(maxWidth, maxHeight);
        $(svg.node).appendTo($("#mainDiv"));

        // Prepares groups for later use
        g = svg.g();
        lines = g.g();





        // Draws the frame around the tree
        g.add(svg.path("M0,0H" + maxX + "V" + maxY + "H0Z").attr({
            fill: 'none',
            stroke: 'black',
            strokeWidth: 2
        }));

        activate_buttons();

        // Calculates info for and draws the minimap
        minimapMaxWidth = $("#minimapDiv").width();
        minimapMaxHeight = $("#minimapDiv").height();
        minimap = Snap(minimapMaxWidth, minimapMaxHeight);
        $(minimap.node).appendTo($("#minimapDiv"));

        minimapOffset = 1;
        minimapMinX = minimapOffset;
        minimapMinY = minimapOffset;

        minimapMaxY = minimapMaxHeight - minimapOffset;
        ratio = maxY / (minimapMaxY - minimapMinY);
        minimapMaxX = maxX / ratio;

        if (minimapMaxX > minimapMaxWidth) {
            minimapMaxX = minimapMaxWidth - minimapOffset;
            ratio = maxX / (minimapMaxX - minimapMinX);
            minimapMaxY = maxY / ratio;
        }

        minimapWindowMaxX = $(window).width() / ratio;
        minimapWindowMaxY = $(window).height() / ratio;

        // The projection of the full window in the minimap
        minimapWindow = minimap.path("M" + minimapMinX + "," + minimapMinY + "H" + minimapWindowMaxX + "V" + minimapWindowMaxY + "H" + minimapMinX + "Z").attr({
            fill: 'lightgray',
            fillOpacity: 0.5,
            stroke: 'black',
            strokeWidth: 1,
            'vector-effect': 'non-scaling-stroke'
        });

        // The border around the minimap
        border = minimap.path("M" + minimapMinX + "," + minimapMinY + "H" + minimapMaxX + "V" + minimapMaxY + "H" + minimapMinX + "Z").attr({
            fill: 'transparent',
            stroke: 'black',
            strokeWidth: 1
        });

        // Jumps to the projected location when clicked inside the border of the minimap (basically, when clicked inside the minimap)
        border.click(function (event) {
            posX = event.offsetX * scale;
            posY = event.offsetY * scale;
            moveX = posX * ratio;
            moveY = posY * ratio;
            setTransform("translate", -moveX + maxWidth / 2, -moveY + maxHeight / 2);
        });

        // Draws the lines showing the distances
        // TODO write this nicer
        topBottom = [-5, maxY + 15];
        let topBottomLine;
        topBottom.forEach(function (value) {
            for (var i = 0; i < maxLength * multiplier; i++) {
                topBottomLine = svg.line(10 + scaleX * i / multiplier, value - 10, 10 + scaleX * i / multiplier, value).attr({
                    fill: 'none',
                    stroke: 'black',
                    strokeWidth: 2
                });
                topBottomLine.append(Snap.parse('<title>' + i / multiplier + '</title>'));
                lines.add(topBottomLine);
                // TODO could be put exactly in the middle, now only puts the beginning above the line
                // g.add(svg.text(10 + scaleX * i, value - 20, i + ".0").attr({dominantBaseline: 'middle', fontSize: fontSize}));
            }
            topBottomLine = svg.line(10 + scaleX * maxLength, value - 10, 10 + scaleX * maxLength, value).attr({
                fill: 'none',
                stroke: 'black',
                strokeWidth: 2
            });
            topBottomLine.append(Snap.parse('<title>' + maxLength + '</title>'));
            lines.add(topBottomLine);
            // TODO could be put exactly in the middle, now only puts the beginning above the line
            // g.add(svg.text(10 + scaleX * maxLength, value - 20, maxLength).attr({dominantBaseline: 'middle', fontSize: fontSize}));
            lines.add(svg.line(10, value - 5, 10 + scaleX * maxLength, value - 5).attr({
                fill: 'none',
                stroke: 'black',
                strokeWidth: 2
            }));
        });
        for (var i = 0; i < maxLength * multiplier; i++) {
            topBottomLine = svg.line(10 + scaleX * i / multiplier, topBottom[0], 10 + scaleX * i / multiplier, topBottom[1] - 10).attr({
                fill: 'none',
                stroke: 'black',
                strokeWidth: 2,
                strokeOpacity: 0.125
            });
            topBottomLine.append(Snap.parse('<title>' + i / multiplier + '</title>'));
            lines.add(topBottomLine);
        }
        topBottomLine = svg.line(10 + scaleX * maxLength, topBottom[0], 10 + scaleX * maxLength, topBottom[1] - 10).attr({
            fill: 'none',
            stroke: 'black',
            strokeWidth: 2,
            strokeOpacity: 0.125
        });
        topBottomLine.append(Snap.parse('<title>' + maxLength + '</title>'));
        lines.add(topBottomLine);

        //svg.mousedown(funcMouseDown);
        //svg.mouseup(funcMouseUp);
        //svg.mousemove(funcMouseMove);

        //scaleX = (maxWidth - longestNameWidth - (2.5 * offset)) / maxLength;
        //scaleY = maxHeight / (amount + 1);

        //let paths = [];

        /**
         * Handles rerooting
         */
        function outgroup() {
            // The outgroup has been called through the context menu on a branch
            if (context_id != null) {
                // Calls the backend providing the selected path and the current tree
                load("get", {
                    'id': context_id,
                    'current': counter_of_trees
                });
                context_id = null;
            // The outgroup has been called through the button after a path has been selected
            } else if (!(typeof clickedPath === "undefined" || (typeof clickedPath === "object" && !clickedPath))) {
                // Calls the backend providing the selected path and the current tree
                load("get", {
                    'id': clicked_id,
                    'current': counter_of_trees
                });
                clicked_id = null;
                clickedPath = null;
            // Legacy
            } else if (clickedPath.attr("data-parent") != 0) {
                clickedPath.attr({
                    strokeOpacity: ''
                });
                childrenIds = [clickedPath.attr("data-l_child"), clickedPath.attr("data-r_child")];
                while ((typeof childrenIds !== "undefined") && (childrenIds.length > 0)) {
                    childId = childrenIds.shift();
                    childPath = svg.select("path[data-id='" + childId + "']");
                    if (childPath) {
                        childPath.attr({
                            strokeOpacity: '',
                            pointerEvents: ''
                        });
                        if (childPath.attr("data-l_child") && childPath.attr("data-r_child")) {
                            childrenIds.push(childPath.attr("data-l_child"), childPath.attr("data-r_child"));
                        }
                    }
                    childText = svg.select("text[data-id='" + childId + "']");
                    if (childText) {
                        childText.attr({
                            opacity: '',
                            pointerEvents: ''
                        });
                    }
                }
                clicked_id = null;
                clickedPath = null;
            }
            toggleOutgroupButton();
        }


        /**
         * Gets subtree of a givin node
         * @param start clicked node
         * @returns {*[]} Subtreelist with ids of the subnodes
         */
        function getTree(start){
            const children = [];
            const stack = [start]

            while(stack.length > 0){
                const a = stack.pop();
                const node = data.find(n => n["id"] === a);
                if(node == null) continue;
                ["l_child","r_child"].forEach(child => {
                    const childid = node[child];
                    if(childid !== undefined && childid !== null){
                        children.push(childid);
                        stack.push(childid);
                    }
                });
            }
            return children.filter(elements => elements);
        }


        /**
         * Collapse function. Collapses / Expands a node with the subtree
         * @param childitem childnode (l_node / r_node)
         * @param start startnode
         * @param collapsed_check  check if tree at given node is collapsed or not
         * @param direct direction of the node (right / left)
         */
        function collapse(childitem, start, collapsed_check, direct){
            const sub = getTree(childitem);
            const parent = data.find(d => d["id"] === start);
            let side;

            if(direct === "right") side = "r_child";
            if(direct === "left") side = "l_child";
            const child = parent[side];
            if(child === null) return;

            //'GRANDPARENT' Problem fix => remove lines && custom label
            const temp = getTree(child);
            temp.push(child);
            temp.forEach(id =>{
                const clean_lines  =svg.selectAll(`[data-collapsed-Line^='${id}']`);
                if(clean_lines !== null) clean_lines.forEach(i => i.remove());
            });
            const currentcollapsed = svg.select(`[data-collapsed-Line^='${child}']`);

            if(currentcollapsed !== null){
                svg.selectAll(`[data-collapsed-Line^='${child}']`).remove()
                const childsub = getTree(child);
                childsub.forEach(c => {
                         //MERGE: Push all c elements to subtree
                          if(!sub.includes(c)) sub.push(c);
                     });
            }
            //Resets state for concat collapse
            const temptree = getTree(child);
            temptree.push(parent[side])

            temptree.forEach(ci => {
                if(collapsedmap[ci]["left"]){
                    collapsedmap[ci]["left"] = false;
                    svg.selectAll(`[data-id='${ci}']`).attr({stroke: "red"});
                }
                if(collapsedmap[ci]["right"]){
                    collapsedmap[ci]["right"] = false;
                    svg.selectAll(`[data-id='${ci}']`).attr({stroke: "red"});

                }

            });

            // COLAPSE
            if(collapsed_check){
                svg.selectAll(`circle[data-id='${childitem}']`).attr({display: "none"});
                minimap.selectAll(`path[data-id='${childitem}']`).attr({display: "none"});
                sub.forEach(child => {
                    svg.selectAll(`[data-id='${child}']`).attr({display: "none"});
                    svg.selectAll(`circle[data-id='${child}']`).attr({display: "none"});
                    minimap.selectAll(`path[data-id='${child}']`).attr({display: "none"});
                });

                draw_collapsed_line(childitem, start, collapsed_check, direct);
                updateSpacing(start, collapsed_check, direct);


            //EXPAND
            }else{
                svg.selectAll(`circle[data-id='${childitem}']`).attr({display: "inline"});
                minimap.selectAll(`path[data-id='${childitem}']`).attr({display: "inline"});
                sub.forEach(child => {
                    svg.selectAll(`[data-id='${child}']`).attr({display: "inline"});
                    svg.selectAll(`circle[data-id='${child}']`).attr({display: "inline"});
                    minimap.selectAll(`path[data-id='${child}']`).attr({display: "inline"});

                });
               //TODO: FIX SPACING: DRAWING WRONG BUT STATES ARE CORRECT
              getTree(start).forEach(child => {
                  if(collapsedmap[child]["l-d"]) svg.select(`path[data-id='${collapsedmap[child]["left_id"]}']`).attr({d: collapsedmap[child]["l-d"], stroke: "red"});
                  if(collapsedmap[child]["r-d"]) svg.select(`path[data-id='${collapsedmap[child]["right_id"]}']`).attr({d: collapsedmap[child]["r-d"], stroke: "red"});
                  if(collapsedmap[child]["l_edge-Y"]) svg.select(`circle[data-id='${child}'][data-direct='left']`).attr({cy: collapsedmap[child]["l_edge-Y"], "data-v":collapsedmap[child]["l_edge-Y"]});
                  if(collapsedmap[child]["r_edge-Y"]) svg.select(`circle[data-id='${child}'][data-direct='right']`).attr({cy: collapsedmap[child]["r_edge-Y"], "data-v":collapsedmap[child]["r_edge-Y"]});
                  if(collapsedmap[child]["r-d"]) minimap.select(`path[data-child='${collapsedmap[child]["right_id"]}`).attr({d: collapsedmap[child]["minimap-r-m"]});
                  if(collapsedmap[child]["l-d"]) minimap.select(`path[data-child='${collapsedmap[child]["left_id"]}']`).attr({d: collapsedmap[child]["minimap-r-m"]});
              });


                draw_collapsed_line(childitem, start, collapsed_check, direct);
                updateSpacing(start, collapsed_check, direct);

            }
        }

        /**
         * Draws collapsed related stuff.
         * @param childitem childnode (l_node / r_node)
         * @param start startnode
         * @param collapsed_check  check if tree at given node is collapsed or not
         * @param direct direction of the node (right / left)
         */
        function draw_collapsed_line(childitem, start, collapsed_check, direct){

            const circle = svg.select(`circle[data-id='${start}'][data-direct='${direct}']`);
            const sub = getTree(childitem);
            const item_counter = sub.filter(id => {
                const n = data.find(d => d["id"] === id);
                return n["name"] !== "None";
            }).length;

            const item_name_container = sub.
            map(id=>data.find(d => d["id"] === id)).
            filter(n => n["name"] !== "None").
            map(n => n["name"]);
            const preview_containing = item_name_container.slice(0,10).join(", ");

            let coll_line = null;
            let nameText = null;

            if(collapsed_check){
                nameText = svg.text(maxX - offset,  circle.attr("data-v"), "'"+collapsedmap[start]["label"]+"'"+ " (" + item_counter+ ")").attr({
                    dominantBaseline: 'middle',
                    fontSize: fontSize,
                    fill: "black",
                    display: "inline",
                    "data-collapsed-Line": `${start}-${direct}`,
                    textAnchor: 'end',
                    fontStyle: "italic"
                });
                g.add(nameText);

                coll_line = svg.line(circle.attr("data-h"), circle.attr("data-v"), maxX - (1.5 * offset) - Math.ceil(nameText.getBBox().width), circle.attr("data-v")).attr({
                    stroke: "black",
                    display: "inline",
                    "data-collapsed-Line": `${start}-${direct}`,
                    strokeWidth: 2,
                });
                g.add(coll_line);

                //TODO: Draw line for collapsed.

               // coll_minimap_line = minimap.line();

                nameText.hover(
                    function (){
                        this.node.style.cursor = "pointer";
                        this.attr({fill:"#1e90ff"});
                        const box = this.getBBox();
                        let text;
                        if(item_counter <= 10) {
                            text = svg.text(box.x + box.width + 10, box.y + box.height / 2,
                                "'"+collapsedmap[start]["label"]+"' "+"contains  "+item_counter+" taxa:  "  + preview_containing + ", ... ( 0 More )" ).attr({
                                fill: "#171515",
                                "collapse-hover-id": start
                            });

                        }else if(item_counter > 10){
                            text = svg.text(box.x + box.width + 10, box.y + box.height / 2,
                                "'"+collapsedmap[start]["label"]+"' "+"contains "+item_counter+" taxa:  " + preview_containing + ", ... ( "+ (item_counter-10)+ " More )" ).attr({
                                fill: "#171515",
                                "collapse-hover-id": start
                            });

                        }
                        const textbox = text.getBBox();
                        const desc = svg.rect(textbox.x - 5, textbox.y-3,textbox.width+80, textbox.height+25,5,5).attr({
                            strokeWidth: 0.5,
                            fill: "#bdbdbd",
                            stroke: "black",
                            "collapse-hover-id": start
                        });

                        g.add(desc);
                        g.add(text);

                    },
                    function (){
                        this.node.style.cursor = "default";
                        this.attr({fill:"#000000"});
                        svg.selectAll(`[collapse-hover-id='${start}']`).remove();
                    }
                );

                //UPDATE NAMETAG IF NAME CHANGED
                nameText.click(function () {
                    const box = this.getBBox();
                    const ctm = this.node.getScreenCTM();
                    const point = svg.node.createSVGPoint();
                    point.x = box.x;
                    point.y = box.y;
                    const spoint = point.matrixTransform(ctm);
                    const input = document.createElement("input");
                    input.classList.add("svg-edit-input");
                    input["type"] = "text";
                    input["value"] = "New label(Not empty)";
                    input["style"]["position"] = "absolute";
                    input["style"]["left"] = `${spoint.x}px`;
                    input["style"]["top"] = `${spoint.y}px`;
                    document.body.append(input);
                    input.focus();

                    input.addEventListener("keydown", e=>{
                        if(e.key === "Enter"){
                            if(input["value"] !== ""){
                                const newtext = input["value"];
                                collapsedmap[start]["label"] = newtext;
                                this.attr({
                                    text: "\""+newtext+"\"" + "("+item_counter+")",
                                    fontStyle: "italic"
                                })
                                const newlinelength = Math.ceil(nameText.getBBox().width);
                                coll_line.attr({
                                    x2: maxX - (1.5 * offset) - newlinelength
                                });
                                input.remove();
                            }
                        }
                    });

                });
            }else{
                svg.selectAll(`[data-collapsed-Line='${start}-${direct}']`).remove()
            }
        }

        /**
         * Updates the spacing after collapse
         * @param start startnode
         * @param collapsed_check collapse check (true/false) at certain node
         * @param direct (direction: left/right)
         */
        function updateSpacing(start, collapsed_check, direct){

            const node = data.find(d=> d["id"] === start);

            let child;
            if(direct === "left") child = node["l_child"];
            if(direct === "right") child = node["r_child"];
            if(!child) return;

            const path = svg.select(`path[data-id='${child}']`);
            if(!path) return;

            let directKey;
            if(direct === "left")directKey = "l-d";
            if(direct === "right")directKey = "r-d";


            if(!collapsedmap[start][directKey]) collapsedmap[start][directKey] = path.attr("d");

            //TODO: Write this nicer and better
            if(collapsed_check){
                let minimapD;
                const pathComponents = path.attr("d").split(/[MHV]/).filter(x => x.trim() !== "");
                const mX = parseFloat(pathComponents[0].split(",")[0]);
                const mY = parseFloat(pathComponents[0].split(",")[1]);
                const hX = parseFloat(pathComponents[2]);

                let newVY;
                if(direct === "left"){
                    newVY = mY-25;
                    minimapD = collapsedmap[start]["minimap-l-m"];
                }
                if(direct === "right"){
                    newVY = mY+25;
                    minimapD = collapsedmap[start]["minimap-r-m"];
                }

                const minimapAttributes = minimapD.split(/[MHV]/).filter(x => x.trim() !== "");
                const miniDX = parseFloat(minimapAttributes[0].split(",")[0]);
                const miniDY = parseFloat(minimapAttributes[0].split(",")[1]);
                const miniDhx = parseFloat(minimapAttributes[2]);
                let newMiniY ;
                let minimapPath;


                if(direct === "left"){
                    minimapPath = minimap.select(`path[data-child='${child}']`);
                    path.attr({d: `M${mX},${mY} V${newVY} H${hX}`});
                    newMiniY = miniDY - 7;
                    minimapPath.attr({d:`M${miniDX},${miniDY} V${newMiniY} H${miniDhx}`});
                }
                if(direct === "right") {
                    minimapPath = minimap.select(`path[data-child='${child}']`);
                    path.attr({d: `M${mX},${mY} V${newVY} H${hX}`});
                    newMiniY = miniDY + 7;
                    minimapPath.attr({d:`M${miniDX},${miniDY} V${newMiniY} H${miniDhx}`});
                }
                const collapsedItems = svg.selectAll(`[data-collapsed-Line='${start}-${direct}']`);
                const circle = svg.select(`circle[data-id='${start}'][data-direct='${direct}']`);

                collapsedItems.forEach(item =>{
                    const t = item.type;

                    if(t === "text"){
                        item.attr({y: newVY});
                    }
                    if(t === "line"){
                        item.attr({y1: newVY, y2:newVY});
                    }
                });

                if(direct === "left")collapsedmap[start]["l_edge-Y"] = circle.attr("data-v");
                if(direct === "right") collapsedmap[start]["r_edge-Y"] = circle.attr("data-v");


                circle.attr({cy: newVY, "data-v":newVY});

            }else{
                path.attr({d: collapsedmap[start][directKey]});
                const collapsedItems = svg.selectAll(`[data-collapsed-Line='${start}-${direct}']`);
                const circle = svg.select(`circle[data-id='${start}'][data-direct='${direct}']`);
                let minimapPath;

                collapsedItems.forEach(item =>{
                    const t = item.type;
                    if(t === "text"){
                        item.attr({y: collapsedmap[start]["collapsed-line-Y"]});
                    }
                    if(t === "line"){
                        item.attr({y1: collapsedmap[start]["collapsed-line-Y"], y2:collapsedmap[start]["collapsed-line-Y"]});
                    }
                });

                let oldCircleY;
                let oldMinimapD;
                if(direct === "left"){
                   minimapPath = minimap.select(`path[data-child='${child}']`);

                   oldCircleY = collapsedmap[start]["l_edge-Y"];
                   oldMinimapD = collapsedmap[start]["minimap-l-m"];
                }
                if(direct === "right"){
                  minimapPath = minimap.select(`path[data-child='${child}']`);

                  oldCircleY = collapsedmap[start]["r_edge-Y"];
                  oldMinimapD = collapsedmap[start]["minimap-r-m"];
                }

                circle.attr({cy: oldCircleY, "data-v":oldCircleY});
                minimapPath.attr({d: oldMinimapD});

            }


        }


        // Draws the branches and texts
        data.forEach(function (item, index, array) {
            // Text
            if (item["name"] != "None") {
                // TODO draw all texts at the right
                // with path stroke dasharray
                //g.add(svg.text(item["total_length"] * scaleX + (1.5 * offset), (index + 1) * scaleY, item["name"]).attr({dominantBaseline: 'middle', fontSize: fontSize, 'data-id': item["id"]}));
                // Draw at the far right with a dashed line
                if (alignLabels) {
                    nameText = svg.text(maxX - offset, (index + 1) * scaleY, item["name"]).attr({
                        dominantBaseline: 'middle',
                        fontSize: fontSize,
                        'data-id': item["id"],
                        textAnchor: 'end'
                    });
                    g.add(nameText);
                    if (item["total_length"] * scaleX + (1.5 * offset) < maxX - (1.5 * offset) - Math.ceil(nameText.getBBox().width) - offset) {
                        g.add(svg.line(item["total_length"] * scaleX + (1.5 * offset), (index + 1) * scaleY, maxX - (1.5 * offset) - Math.ceil(nameText.getBBox().width), (index + 1) * scaleY).attr({
                            fill: 'none',
                            stroke: 'black',
                            strokeWidth: 2,
                            strokeDasharray: 4,
                            "data-id": item["id"]
                        }));
                    }
                // Draw next to the leaf without a dashed line
                } else {
                    nameText = svg.text(item["total_length"] * scaleX + (1.5 * offset), (index + 1) * scaleY, item["name"]).attr({
                        dominantBaseline: 'middle',
                        fontSize: fontSize,
                        'data-id': item["id"]
                    });
                    g.add(nameText);
                }

            // Branch
            } else {
                // Draw bootstrap on the line if provided
                if (item["bootstrap"] != "None" && item["bootstrap"] != "") {
                    parent = array.findIndex((elem) => elem.id == item["parent"]);
                    // TODO could be put exactly in the middle, now only puts the beginning in the middle
                    g.add(svg.text((parseFloat(array[parent]["total_length"]) + (item["length"] / 2)) * scaleX, (index + 1) * scaleY, item["bootstrap"]).attr({
                        dominantBaseline: 'baseline',
                        fontSize: 0.5 * fontSize,
                        'data-id': item["id"]
                    }));
                    // TODO data-id added graying out of child bootstraps but not selected bootstrap
                }

                l_child = array.findIndex((elem) => elem.id == item["l_child"]);
                r_child = array.findIndex((elem) => elem.id == item["r_child"]);

                mX = (item["total_length"] * scaleX) + offset;
                mYLeft = (index + 1) * scaleY - strokeWidth;
                mYRight = (index + 1) * scaleY + strokeWidth;

                // The "root"
                if (item["id"] == 0) {
                    mYLeft += strokeWidth / 2;
                    mYRight -= strokeWidth / 2;
                }

                vLeft = (l_child + 1) * scaleY;
                vRight = (r_child + 1) * scaleY;
                hLeft = array[l_child]["total_length"] * scaleX + offset;
                hRight = array[r_child]["total_length"] * scaleX + offset;

                // Draw the two branches
                left = svg.path("M" + mX + "," + mYLeft + "V" + vLeft + "H" + hLeft).attr({
                    "data-id": array[l_child]["id"],
                    "data-parent": item["id"]
                });
                right = svg.path("M" + mX + "," + mYRight + "V" + vRight + "H" + hRight).attr({
                    "data-id": array[r_child]["id"],
                    "data-parent": item["id"]
                });

                g.add(left, right);



                // NODE FOR COLLAPSE / SIMPLIFICATION
                const r_edge = svg.circle(hRight, vRight, 8).attr({
                    fill: "black",
                    stroke: "black",
                    strokeWidth: 2,
                    "data-id": item["id"],
                    "data-h": hRight,
                    "data-v": vRight,
                    "data-direct": "right",
                });

                // NODE FOR COLLAPSE / SIMPLIFICATION
                const l_edge = svg.circle(hLeft, vLeft, 8).attr({
                    fill: "black",
                    stroke: "black",
                    strokeWidth: 2,
                    "data-id": item["id"],
                    "data-h": hLeft,
                    "data-v": vLeft,
                    "data-direct": "left",
                });

                l_edge.hover(
                    function () {
                        this.node.style.cursor = "pointer";

                }, function () {
                        this.node.style.cursor = "default";
                });
                r_edge.hover(
                    function () {
                        this.node.style.cursor = "pointer";


                }, function () {
                        this.node.style.cursor = "default";

                });

                // Leave isn't leave => check one stage before and delete nodes
                const r_child_check = data.find(d => d["id"] === item["r_child"]);
                const l_child_check = data.find(d => d["id"] === item["l_child"]);


                r_edge.click(function(){
                    document.querySelectorAll(".svg-edit-input").forEach(e => e.remove());
                    collapsedmap[item["id"]]["collapsed-line-Y"] = r_edge.attr("data-v");
                    collapse(item["r_child"],item["id"], !collapsedmap[item["id"]]["right"], "right");
                    collapsedmap[item["id"]]["right"] = !collapsedmap[item["id"]]["right"];
                    collapsedmap[item["id"]]["right_id"] = item["r_child"];

                });
                l_edge.click(function(){
                    document.querySelectorAll(".svg-edit-input").forEach(e => e.remove());
                    collapsedmap[item["id"]]["collapsed-line-Y"] = l_edge.attr("data-v");
                    collapse(item["l_child"],item["id"], !collapsedmap[item["id"]]["left"], "left");
                    collapsedmap[item["id"]]["left"] = !collapsedmap[item["id"]]["left"];
                    collapsedmap[item["id"]]["left_id"] = item["l_child"];

                });
                g.add(r_edge, l_edge);


                //Removing false leaves
                if(r_child_check["name"] !== "None") r_edge.remove();
                if(l_child_check["name"] !== "None") l_edge.remove();


                // Repeat almost everything for the minimap
                mXMinimap = minimapMinX + mX / ratio;
                mYLeftMinimap = minimapMinY + mYLeft / ratio;
                vLeftMinimap = minimapMinY + vLeft / ratio;
                hLeftMinimap = minimapMinX + hLeft / ratio;
                mYRightMinimap = minimapMinY + mYRight / ratio;
                vRightMinimap = minimapMinY + vRight / ratio;
                hRightMinimap = minimapMinX + hRight / ratio;
                minimapLeft = minimap.path("M" + mXMinimap + "," + mYLeftMinimap + "V" + vLeftMinimap + "H" + hLeftMinimap);
                minimapRight = minimap.path("M" + mXMinimap + "," + mYRightMinimap + "V" + vRightMinimap + "H" + hRightMinimap);

                minimapPaths = [minimapLeft, minimapRight];



                minimapPaths.forEach(function (itemMinimapPath, indexMinimapPath, arrayMinimapPath) {

                    if(indexMinimapPath === 0) collapsedmap[item["id"]]["minimap-l-m"] = itemMinimapPath.attr("d");
                    if(indexMinimapPath === 1) collapsedmap[item["id"]]["minimap-r-m"] = itemMinimapPath.attr("d");
                    let data_child;
                    if(indexMinimapPath === 0) data_child = item["l_child"];
                    if(indexMinimapPath === 1) data_child = item["r_child"];


                    itemMinimapPath.attr({
                        fill: 'none',
                        stroke: 'black',
                        strokeWidth: strokeWidth / ratio,
                        strokeLinecap: 'square',
                        "data-id": item["id"],
                        "data-child": data_child // r or l child

                    });
                });


                if (array[l_child]["bootstrap"] != "") {
                    left.append(Snap.parse('<title>' + array[l_child]["bootstrap"] + '</title>'));
                }
                if (array[r_child]["bootstrap"] != "") {
                    right.append(Snap.parse('<title>' + array[r_child]["bootstrap"] + '</title>'));
                }

                if (("l_child" in array[l_child]) && ("r_child" in array[l_child])) {
                    left.attr({
                        "data-l_child": array[l_child]["l_child"],
                        "data-r_child": array[l_child]["r_child"]
                    });
                }
                if (("l_child" in array[r_child]) && ("r_child" in array[r_child])) {
                    right.attr({
                        "data-l_child": array[r_child]["l_child"],
                        "data-r_child": array[r_child]["r_child"]
                    });
                }
                // Configure path hovering and clicking
                paths = [left, right];

                paths.forEach(function (itemPath, indexPath, arrayPath) {
                    // Stlye the paths
                    itemPath.attr({
                        fill: 'none',
                        stroke: 'black',
                        strokeWidth: strokeWidth,
                        strokeLinecap: 'square'
                    });
                    // Change style when hovered
                    itemPath.mouseover(function () {
                        itemPath.attr({
                            stroke: 'dodgerblue',
                            strokeWidth: strokeWidth * 2
                        });
                        if (typeof hoveredPath === "undefined" || (typeof hoveredPath === "object" && !hoveredPath)) {
                            hoveredPath = itemPath.use().attr({
                                pointerEvents: 'none'
                            });
                        }
                    });
                    // Change style when hover ended
                    itemPath.mouseout(function () {
                        itemPath.attr({
                            stroke: 'black',
                            strokeWidth: strokeWidth
                        });
                        hoveredPath.remove();
                        hoveredPath = null;
                    });
                    // Handle clicking of paths
                    itemPath.click(function () {
                        // Select first path
                        if (typeof clickedPath === "undefined" || (typeof clickedPath === "object" && !clickedPath)) {
                            hoveredPath.remove();
                            clickedPath = itemPath;
                            clicked_id = clickedPath.attr("data-id");
                            itemPath.attr({
                                strokeOpacity: 0.25
                            });

                            childrenIds = [itemPath.attr("data-l_child"), itemPath.attr("data-r_child")];
                            while ((typeof childrenIds !== "undefined") && (childrenIds.length > 0)) {
                                childId = childrenIds.shift();
                                childPath = svg.select("path[data-id='" + childId + "']");
                                if (childPath) {
                                    childPath.attr({
                                        strokeOpacity: 0.25,
                                        pointerEvents: 'none'
                                    });
                                    if (childPath.attr("data-l_child") && childPath.attr("data-r_child")) {
                                        childrenIds.push(childPath.attr("data-l_child"), childPath.attr("data-r_child"));
                                    }
                                }
                                childText = svg.select("text[data-id='" + childId + "']");
                                if (childText) {
                                    childText.attr({
                                        opacity: 0.25,
                                        pointerEvents: 'none'
                                    });
                                }
                            }
                            toggleOutgroupButton();
                            // Both paths are the same
                        } else if ((clickedPath == itemPath) ||
                            // Both paths are neighbors
                            (clickedPath.attr("data-parent") == itemPath.attr("data-parent")) ||
                            // Second path is the first one's parent
                            (clickedPath.attr("data-parent") == itemPath.attr("data-id"))) {

                            hoveredPath.remove();
                            clickedPath.attr({
                                strokeOpacity: ''
                            });
                            childrenIds = [clickedPath.attr("data-l_child"), clickedPath.attr("data-r_child")];
                            while ((typeof childrenIds !== "undefined") && (childrenIds.length > 0)) {
                                childId = childrenIds.shift();
                                childPath = svg.select("path[data-id='" + childId + "']");
                                if (childPath) {
                                    childPath.attr({
                                        strokeOpacity: '',
                                        pointerEvents: ''
                                    });
                                    if (childPath.attr("data-l_child") && childPath.attr("data-r_child")) {
                                        childrenIds.push(childPath.attr("data-l_child"), childPath.attr("data-r_child"));
                                    }
                                }
                                childText = svg.select("text[data-id='" + childId + "']");
                                if (childText) {
                                    childText.attr({
                                        opacity: '',
                                        pointerEvents: ''
                                    });
                                }
                            }
                            clicked_id = null;
                            clickedPath = null;
                            toggleOutgroupButton();
                        } else {
                            // Send data to the backend either with the last tree
                            if (counter_of_trees == number_of_trees) {


                                load("get", {
                                    'from': clickedPath.attr("data-id"),
                                    'to': itemPath.attr("data-id")
                                });
                                clicked_id = null;
                                clickedPath = null;



                            // or with the currently shown tree
                            } else {
                                load("get", {
                                    'from': clickedPath.attr("data-id"),
                                    'to': itemPath.attr("data-id"),
                                    'current': counter_of_trees
                                });
                                clicked_id = null;
                                clickedPath = null;
                            }
                        }
                    });

                });
            }
        });


    Object.keys(collapsedmap).forEach(id => {
        document.querySelectorAll(".svg-edit-input").forEach(e => e.remove());
        const node = data.find(d => d["id"] === id);
        if(node === null) return;

        collapsedmap[id]["l-d"] = null;
        collapsedmap[id]["r-d"] = null;
        collapsedmap[id]["l_edge-Y"] = null;
        collapsedmap[id]["r_edge-Y"] = null;
        collapsedmap[id]["collapsed-line-Y"] = null;

        //SIDE SWAP CHECK IF STATEMENTS AFTER BRANCH SWAP
        if(collapsedmap[id]["right"] && collapsedmap[id]["right_id"] !== null){
            if(node["r_child"] !== collapsedmap[id]["right_id"]){
                if(node["l_child"] === collapsedmap[id]["right_id"]){
                    collapsedmap[id]["left"] = true;
                    collapsedmap[id]["right"] = false;
                    collapsedmap[id]["left_id"] = collapsedmap[id]["right_id"];
                    collapsedmap[id]["right_id"] = null;
                }else{
                    collapsedmap[id]["right_id"] = null;
                    collapsedmap[id]["right"] = false;
                }
            }
        }
        if(collapsedmap[id]["left"] && collapsedmap[id]["left_id"] !== null){
            if(node["l_child"] !== collapsedmap[id]["left_id"]){
                if(node["r_child"] === collapsedmap[id]["left_id"]){
                    collapsedmap[id]["right"] = true;
                    collapsedmap[id]["left"] = false;
                    collapsedmap[id]["right_id"] = collapsedmap[id]["left_id"];
                    collapsedmap[id]["left_id"] = null;
                    collapsedmap[id]["minimap-l-m"] = null;
                }else{
                    collapsedmap[id]["left_id"] = null;
                    collapsedmap[id]["left"] = false;
                    collapsedmap[id]["minimap-l-m"] = null;
                }
            }
        }
        //TODO: Check if this code is still necessary (this was a hotfix)


        if(collapsedmap[id]["right"] && collapsedmap[id]["right_id"]){
            const child = collapsedmap[id]["right_id"];
            const path = svg.select(`path[data-id='${child}']`);
            if(path) collapsedmap[id]["r-d"] = path.attr("d");
            const tree = getTree(id);
            tree.forEach(children =>{
                if(collapsedmap[children]["r-d"]){
                    const rightpath_id = collapsedmap[children]["right_id"];
                    const children_path = svg.select(`path[data-id='${rightpath_id}']`);
                    collapsedmap[children]["r-d"] = children_path.attr("d");
                }else if(collapsedmap[children]["l-d"]){
                    const leftpath_id = collapsedmap[children]["left_id"];
                    const children_path = svg.select(`path[data-id='${leftpath_id}']`);
                    collapsedmap[children]["l-d"] = children_path.attr("d");
                }

            });
        }
        if(collapsedmap[id]["left"] && collapsedmap[id]["left_id"]){
            const child = collapsedmap[id]["left_id"];
            const path = svg.select(`path[data-id='${child}']`);
            if(path) collapsedmap[id]["l-d"] = path.attr("d");
            const tree = getTree(id);
            tree.forEach(children =>{
                if(collapsedmap[children]["r-d"]){
                    const rightpath_id = collapsedmap[children]["right_id"];
                    const children_path = svg.select(`path[data-id='${rightpath_id}']`);
                    collapsedmap[children]["r-d"] = children_path.attr("d");
                }else if(collapsedmap[children]["l-d"]){
                    const leftpath_id = collapsedmap[children]["left_id"];
                    const children_path = svg.select(`path[data-id='${leftpath_id}']`);
                    collapsedmap[children]["l-d"] = children_path.attr("d");
                }
            });
        }
        if(collapsedmap[id]["right"]){
            collapse(node["r_child"], id ,collapsedmap[id]["right"], "right");
        }
        if(collapsedmap[id]["left"]){
            collapse(node["l_child"], id ,collapsedmap[id]["left"], "left");
        }
    });



        // Sets the initial position
        if (typeof xBefore === "undefined") {
            xBefore = 20;
        }
        if (typeof yBefore === "undefined") {
            yBefore = 20;
        }
        if (typeof scaleBefore === "undefined") {
            setTransform("translate", xBefore, yBefore);
        } else {
            setTransform("scale", scaleBefore, xBefore, yBefore);
        }

        // TODO think of the boundaries!
        var startX, startY;
        let move;
        let step = 0.1;

        /**
         * Detect mouse movement start and change cursor appearance
         * @param event mousedownevent
         */
        function funcMouseDown(event) {
            startX = event.clientX;
            startY = event.clientY;
            move = true;
            // TODO only when existing?
            $(svg.node).css("cursor", "move");
        }

        /**
         * Detect mouse movement end and change cursor appearance
         * @param event mouseupevent
         */
        function funcMouseUp(event) {
            move = false;
            // TODO only when existing?
            $(svg.node).removeAttr("style");
        }

        /**
         * Detect mouse movement itself and move svg accordingly
         * @param event mousemoveevent
         */
        function funcMouseMove(event) {
            /*console.log(event.which + event.ctrlKey + event.clientX + event.clientY);*/

            if (move) {
                let offsetX = event.clientX - startX;
                let offsetY = event.clientY - startY;

                currentX = getTransform("x");
                currentY = getTransform("y");

                moveX = currentX + offsetX;
                moveY = currentY + offsetY;

                setTransform("translate", moveX, moveY);
                startX = event.clientX;
                startY = event.clientY;
            }
        }

        /**
         * Detect mouse wheel and zoom svg accordingly
         * @param event mousewheelevent
         */
        function funcWheel(event) {
            currentX = getTransform("x");
            currentY = getTransform("y");
            currentScale = getTransform("scale");

            posX = event.originalEvent.clientX;
            posY = event.originalEvent.clientY;

            // Handles edge cases
            if (posX == 0) {
                posX = 1;
            }
            if (posY == 0) {
                posY = 1;
            }
            if (event.originalEvent.deltaY < 0) {
                newScale = currentScale + step;
            } else {
                newScale = currentScale - step;
            }

            moveX = currentX - ((newScale / currentScale) - 1) * (posX - currentX);
            moveY = currentY - ((newScale / currentScale) - 1) * (posY - currentY);

            setTransform("scale", newScale, moveX, moveY);
        }

        /**
         * Sets the dimensions for the svg
         */
        function setTransform() {
            if (typeof g === "undefined") {
                return;
            }
            originalTranslateX = getTransform("x");
            originalTranslateY = getTransform("y");
            originalScale = getTransform("scale");

            // Either move or zoom
            if (arguments[0] == "translate") {
                scale = originalScale;
                translateX = arguments[1];
                translateY = arguments[2];
            } else if (arguments[0] == "scale") {
                scale = arguments[1];
                translateX = arguments[2];
                translateY = arguments[3];

                minScale = 0.1;
                maxScale = 2;

                if (scale < minScale) {
                    scale = minScale;
                    translateX = originalTranslateX;
                    translateY = originalTranslateY;
                } else if (scale > maxScale) {
                    scale = maxScale;
                    translateX = originalTranslateX;
                    translateY = originalTranslateY;
                }
            }

            minTranslateX = 0;
            minTranslateY = 0;
            maxTranslateX = maxWidth - maxX * scale;
            maxTranslateY = maxHeight - maxY * scale;

            // TODO hinder moving to far into any direction
            // TODO zooming needs finetuning

            /*if (translateX < minTranslateX) {
                translateX = minTranslateX;
            } else if (translateX > maxTranslateX) {
                translateX = maxTranslateX;
            }

            if (translateY < minTranslateY) {
                translateY = minTranslateY;
            } else if (translateY > maxTranslateY) {
                translateY = maxTranslateY;
            }*/

            g.transform("translate(" + translateX + " " + translateY + ") scale(" + scale + " " + scale + ")");
            minimapWindow.transform("translate(" + -(translateX / scale) / ratio + " " + -(translateY / scale) / ratio + ") scale(" + (1 / scale)  + " " +  (1 / scale) + ")");
        }

        /**
         * Gets the dimensions of the svg
         * @returns {number|*|scale} requested dimension
         */
        function getTransform() {
            if (typeof g === "undefined") {
                return;
            }
            if (g.transform().total !== "") {
                currentTransform = g.transform().totalMatrix;
                translateX = parseFloat(currentTransform["e"]);
                translateY = parseFloat(currentTransform["f"]);
                scale = parseFloat(currentTransform["a"]);
            } else {
                translateX = 0;
                translateY = 0;
                scale = 1;
            }
            switch (arguments[0]) {
                case "x":
                    return translateX;
                case "y":
                    return translateY;
                case "scale":
                    return scale;
            }
        }



        $(svg.node).mousedown(funcMouseDown);
        $(svg.node).mouseup(funcMouseUp);
        $(svg.node).mousemove(funcMouseMove);
        $(svg.node).on("wheel", funcWheel);

        /**
         * Activates the buttons and adds their events
         */
        function activate_buttons() {
            if (!(buttons_activated)) {
                $("#save-button").prop("disabled", false);
                $("#zoom-in-button").prop("disabled", false);
                $("#zoom-out-button").prop("disabled", false);
                $("#search-text").prop("disabled", false);
                $("#search-button").prop("disabled", false);
                $("#lengths-button").prop("disabled", false);
                $("#labels-button").prop("disabled", false);
                $("#snapshots-button").prop("disabled", false);

                // Calls the undo function for button and context option
                $("#undo-button").click(function (event) {
                    undo();
                });
                $("#context-undo").click(function (event) {
                    $("#context-menu").removeClass("visible");
                    undo();
                });

                // Calls the redo function for button and context option
                $("#redo-button").click(function (event) {
                    redo();
                });
                $("#context-redo").click(function (event) {
                    $("#context-menu").removeClass("visible");
                    redo();
                });

                // Shows the info modal if a snapshot already exists or shows the save modal for button and context option
                $("#save-button").click(function (event) {
                    $("#snapshot-label").val("");
                    if (snapshotTrees.find(element => element[0] == trees[counter_of_trees - 1][0])) {
                        // Shows the info modal
                        $("#info-modal-label").text("This snapshot already exists!")
                        $("#info-modal-body").text("This tree has already been snapshot.")
                        $("#info-modal").modal("show");
                        return;
                    }
                    // Shows the save modal
                    $("#save-modal").modal("show");
                    $("#save-modal").on("shown.bs.modal", function () {
                        // Puts the cursor in the input field
                        $("#snapshot-label").focus();
                    });
                });
                $("#context-save").click(function (event) {
                    $("#context-menu").removeClass("visible");
                    $("#snapshot-label").val("");
                    if (snapshotTrees.find(element => element[0] == trees[counter_of_trees - 1][0])) {
                        // Shows the info modal
                        $("#info-modal-label").text("This snapshot already exists!")
                        $("#info-modal-body").text("This tree has already been snapshot.")
                        $("#info-modal").modal("show");
                        return;
                    }
                    // Shows the save modal
                    $("#save-modal").modal("show");
                    $("#save-modal").on("shown.bs.modal", function () {
                        // Puts the cursor in the input field
                        $("#snapshot-label").focus();
                    });
                });

                // Calls the save function for button and context option
                $("#save-modal-button").click(function (event) {
                    save();
                    $("#save-modal").modal("hide");
                });
                $('#snapshot-label').keypress(function (event) {
                    if (event.which == '13') {
                        save();
                        $("#save-modal").modal("hide");
                    }
                });

                // Shows the snapthots modal for button and context option
                $("#snapshots-button").click(function (event) {
                    $("#snapshots-modal").modal("show");
                });
                $("#context-snapshots").click(function (event) {
                    $("#context-menu").removeClass("visible");
                    $("#snapshots-modal").modal("show");
                });

                // Zooms in around the center for button and context option
                $("#zoom-in-button").click(function (event) {
                    setTransform("scale", getTransform("scale") + step, getTransform("x"), getTransform("y"));
                });
                $("#context-zoom-in").click(function (event) {
                    $("#context-menu").removeClass("visible");
                    setTransform("scale", getTransform("scale") + step, getTransform("x"), getTransform("y"));
                });

                // Zooms out around the center for button and context option
                $("#zoom-out-button").click(function (event) {
                    setTransform("scale", getTransform("scale") - step, getTransform("x"), getTransform("y"));
                });
                $("#context-zoom-out").click(function (event) {
                    $("#context-menu").removeClass("visible");
                    setTransform("scale", getTransform("scale") - step, getTransform("x"), getTransform("y"));
                });

                // Calls the search function with input from the search field for button and context option
                $("#search-button").click(function (event) {
                    document.querySelectorAll(".svg-edit-input").forEach(e => e.remove());
                    search($("#search-text").val());
                });

                $('#search-text').keypress(function (event) {
                    document.querySelectorAll(".svg-edit-input").forEach(e => e.remove());
                    if (event.which == '13') {
                        search($("#search-text").val());
                    }
                });

                // Calls the toggleLength function for button and context option
                $("#lengths-button").click(function (event) {
                    toggleLength();
                });
                $("#context-lengths").click(function (event) {
                    $("#context-menu").removeClass("visible");
                    toggleLength();
                });

                // Calls the toggleLabel function for button and context option
                $("#labels-button").click(function (event) {
                    toggleLabel();
                });
                $("#context-labels").click(function (event) {
                    $("#context-menu").removeClass("visible");
                    toggleLabel();
                });

                // Calls the outgroup function for button and context option
                $("#outgroup-button").click(function (event) {
                    outgroup();
                });
                $("#context-outgroup").click(function (event) {
                    $("#context-menu").removeClass("visible");
                    outgroup();
                });

                // Sets the flag for button activation
                buttons_activated = true;
            }
        }

        /**
         * Searches for a leaf and jumps to it and colors it when it is found
         * @param value the searched leaf
         */
        function search(value) {
            // Different x coordinate depending on whether branch lengths are shown
            if (!(enableLengths)) {
                data = JSON.parse(trees[counter_of_trees - 1][1]);
            } else {
                data = JSON.parse(trees[counter_of_trees - 1][2]);
            }
            data.forEach(function(item, index, array) {
                // Searches through the all texts, colors all and jumps to the last match
                if (typeof item.name !== 'undefined' && item.name != "None" && item.name.toLowerCase().includes(value.toLowerCase())) {
                    svg.select("text[data-id='" + item.id + "']").attr('fill', 'red');
                    if (!(alignLabels)) {
                        setTransform("translate", -(item["total_length"] * scaleX + offset) + maxWidth / 2, -((index + 1) * scaleY) * scale + maxHeight / 2);
                    } else {
                        setTransform("translate", -(maxX - offset) * scale + maxWidth / 2, -((index + 1) * scaleY) * scale + maxHeight / 2);
                    }
                } else if (typeof item.name !== 'undefined' && item.name != "None") {
                    // Resets texts that have not been searched for to black
                    svg.select("text[data-id='" + item.id + "']").attr('fill', null);
                }
            });
        }

        /**
         * Undoes the last action
         */
        function undo() {
            if (counter_of_trees > 1) {
                counter_of_trees -= 1;

            }
            if (counter_of_trees == 1) {
                $("#undo-button").prop("disabled", true);
            }
            update(JSON.stringify(trees));
        }

        /**
         * Redoes the last action
         */
        function redo() {
            if (counter_of_trees < number_of_trees) {
                counter_of_trees += 1;
            }
            if (counter_of_trees == number_of_trees) {
                $("#redo-button").prop("disabled", true);
            }
            update(JSON.stringify(trees));
        }

        /**
         * Shows the branch lengths if they are available and hides them if they are shown
         */
        function toggleLength() {
            if (enableLengths) {
                draw(JSON.parse(trees[counter_of_trees - 1][1]));
                $("#lengths-button-hide").hide();
                $("#lengths-button-show").show();
            } else {
                if (trees[counter_of_trees - 1][2] != null) {
                    draw(JSON.parse(trees[counter_of_trees - 1][2]));
                    $("#lengths-button-show").hide();
                    $("#lengths-button-hide").show();
                } else {
                    $("#compute-modal").modal("show");
                }
            }
        }

        /**
         * Aligns the labels or attaches them to the branches
         */
        function toggleLabel() {
            if (alignLabels) {
                $("#labels-button-align").hide();
                $("#labels-button-attach").show();
                alignLabels = false;
            } else {
                $("#labels-button-attach").hide();
                $("#labels-button-align").show();
                alignLabels = true;
            }
            if (!enableLengths) {
                draw(JSON.parse(trees[counter_of_trees - 1][1]));
            } else if (trees[counter_of_trees - 1][2] != null) {
                draw(JSON.parse(trees[counter_of_trees - 1][2]));
            }
        }

        /**
         * Resizes the divs when the window gets resized
         */
        $( window ).resize(function() {
            console.log(window);
            maxHeight = $(window).height();
            maxWidth = $(window).width();
            $( "#mainDiv" ).height($( window ).height());
            $(svg.node).height($( window ).height());
            //$(svg).height($( window ).height());
            svg.attr({
                height: $( window ).height()
            });
        });

        /**
         * Stops the context menu from being drawn out of bounds
         * @param mouseX x position of the mouse
         * @param mouseY y position of the mouse
         * @returns {{normalizedY: number, normalizedX: number}} new mouse position
         */
        function normalizePosition(mouseX, mouseY) {
            let normalizedX = mouseX;
            let normalizedY = mouseY;
            if (mouseX + $("#context-menu").outerWidth() > $("#mainDiv").outerWidth()) {
                normalizedX = $("#mainDiv").outerWidth() - $("#context-menu").outerWidth();
            }
            if (mouseY + $("#context-menu").outerHeight() > $("#mainDiv").outerHeight()) {
                normalizedY = $("#mainDiv").outerHeight() - $("#context-menu").outerHeight();
            }
            return {normalizedX, normalizedY};
        }

        /**
         * Changes the context menu to the custom one
         */
        $("#mainDiv").contextmenu(function (event) {
            if (event.target.tagName == "line" || event.target.tagName == "svg" || event.target.tagName == "path") {
                event.preventDefault();
                const {clientX: mouseX, clientY: mouseY} = event;
                const {normalizedX, normalizedY} = normalizePosition(mouseX, mouseY);
                $("#context-menu").css({top: normalizedY, left: normalizedX});
                $("#context-menu").addClass("visible");
                if (event.target.tagName == "path") {
                    $("#context-outgroup").show();
                    context_id = $(event.target).data("id");
                } else {
                    $("#context-outgroup").hide();
                }
            }
        });

        /**
         * Hides the context menu on click
         */
        $("#mainDiv").mousedown(function (event) {
            if (event.target.offsetParent != $("#context-menu")) {
                $("#context-menu").removeClass("visible");
            }
        });


    }



    /**
     * Enables the custom buttons for alignment file handling
     */
    $("#alignment-file-button").on("click", function () {
        $("#alignment-file").trigger("click");
    });
    $("#alignment-file:file").change(function () {
        $("#alignment-file-button").html('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-check" viewBox="0 0 16 16"><path d="M10.854 7.854a.5.5 0 0 0-.708-.708L7.5 9.793 6.354 8.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/></svg>');
        $('label[for="alignment-file-button"]').html($(this)[0].files[0].name);

        let autoReader = new FileReader();
        autoReader.onload = function (data) {
            text = atob(data.target.result.split("base64,")[1]);
            if ((text.match(/[ACGT]/g) || []).length > text.length / 2) {
                $("#dna").trigger("click");
                // Shows the info modal
                $("#info-modal-label").text("DNA sequence detected!");
                $("#info-modal-body").text("A DNA sequence has been auto-detected and the options have been set to DNA. You can overrule this manually by checking PROTEIN in the options.");
                $("#info-modal").modal("show");
            } else {
                $("#protein").trigger("click");
                // Shows the info modal
                $("#info-modal-label").text("Protein sequence detected!");
                $("#info-modal-body").text("A protein file has been detected and the options have been set to protein. You can overrule this manually by checking DNA in the options.");
                $("#info-modal").modal("show");
            }
            optionsJSON = {
                "working-directory": $("#working-directory").val()
            }
            if (dnaProtein == "dna") {
                optionsJSON["dna-protein"] = "dna";
                optionsJSON["dna-bsr"] = $("#selectBSR").val();
                optionsJSON["dna-bf"] = $("#selectBF").val();
                optionsJSON["dna-rhas"] = $("#selectDNARHAS").val();
            } else if (dnaProtein == "protein") {
                optionsJSON["dna-protein"] = "protein";
                optionsJSON["protein-aaerm"] = $("#selectAAERM").val();
                optionsJSON["protein-pmm"] = $("#selectPMM").val();
                optionsJSON["protein-aaf"] = $("#selectAAF").val();
                optionsJSON["protein-rhas"] = $("#selectAARHAS").val();
            }
            options(optionsJSON);
        }
        autoReader.readAsDataURL($(this)[0].files[0]);
    });

    /**
     * Enables the custom buttons for tree file handling
     */
    $("#tree-file-button").on("click", function () {
        $("#tree-file").trigger("click");
    });
    $("#tree-file:file").change(function () {
        $("#tree-file-button").html('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-file-earmark-check" viewBox="0 0 16 16"><path d="M10.854 7.854a.5.5 0 0 0-.708-.708L7.5 9.793 6.354 8.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/></svg>');
        $('label[for="tree-file-button"]').html($(this)[0].files[0].name);
        var path = (window.URL || window.webkitURL).createObjectURL($(this)[0].files[0]);
        console.log('path', path);
    });

    /**
     * Draws the instructions visible before importing
     */
    function drawInstructions(maxWidth, maxHeight) {
        console.log(maxWidth);
        if (typeof instructions !== "undefined") {
            instructions.remove();
        }

        instructions = Snap(maxWidth, maxHeight);
        $(instructions.node).appendTo($("#mainDiv"));
        instructions_g = instructions.g();
        instructions_lines = instructions_g.g();
        instructions_texts = instructions_g.g();

        buttons_names = ["undo", "redo", "save", "snapshots", "zoom-in", "zoom-out", "search", "lengths", "labels", "options", "help"];

        buttons_names.forEach(function (value, index) {
            current_button = $("#" + value + "-button");

            current_length = 25 + 25 * (index % 2);

            current_x = current_button.offset().left + current_button.outerWidth() / 2;
            current_y = current_button.offset().top + current_button.outerHeight() + 15;
            instructions_lines.add(instructions.path("M" + current_x + "," + current_y + "V" + (current_y + current_length)).attr({
                stroke: 'black'
            }));
            instructions_lines.add(instructions.polyline((current_x - 3.5) + "," + current_y + " " + current_x + "," + (current_y - 5) + " " + (current_x + 3.5) + "," + current_y));
            instructions_texts.add(instructions.text(current_x, (current_y + current_length), current_button.attr("title")).attr({
                dominantBaseline: 'hanging',
                fontSize: '0.625em',
                textAnchor: 'middle'
            }));
        });
    }

    /**
     * Handles resizing
     */
    $( window ).resize(function() {
        maxHeight = $(window).height();
        maxWidth = $(window).width();
        drawInstructions(maxWidth, maxHeight);
    });

});