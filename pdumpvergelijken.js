/*
	pdumpvergelijken - vergelijk pdump bestanden
    Copyright (C) 2022 Gemeente Den Haag, Netherlands
    Developed by Jasper Vries
 
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
 
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

var table = [];

function loadFileContentsHandle(type) {
    var file = document.getElementById('input').value;
    if (type == 'open') {
        setLoadingScreen('Bestand openen...');
        setTimeout(function() { 
            var res = loadSavedFile(file); 
            if (res) {
                setTimeout(function() { setRowClasses(); }, 200);
            }
            else {
                alert('Kan bestand niet openen. Ongeldig bestandsformaat.');
            }
            setTimeout(function() { setLoadingScreen(null); }, 300)
        }, 1);
        
    }
    else if ((type == 'old') || (type == 'new')) {
        setLoadingScreen('Gegevens inlezen...');
        setTimeout(function() { read_pdump(type, file); }, 3);
        setTimeout(function() { setLoadingScreen(null); }, 4);
    }
    setFirstRun(false);
}

function saveAsButtonClickHandle() {
    download_file(JSON.stringify(table), 'pdumpvergelijking.pdv')
}

function newButtonClickHandle() {
    //clear table
    table = [];
    $('#outputtable tbody').html('');
}

function read_pdump(type, pdump) { 
    let initialtablelength = table.length;
    let matches = pdump.matchAll(/([A-Z]+) ([A-Za-z0-9_ ]+): (-?\d+(\/[a-z]{2,3})?)\s?/g);
    matches = Array.from(matches);
    //example result:
    //0: "PRM prio2fc48: 123/ct\n"
    //​1: "PRM"
    //​2: "prio2fc48"
    //​3: "123/ct"
    //​​4: "/ct"
    //read into table
    matches.forEach((item) => {
        //check if row in table exists
        let rowupdated = false;
        for (let row of table) {
            if ((row.obj == item[1])
            && (row.var == item[2])) {
                //update array
                row[type] = item[3];
                //update html table
                var tdofsset = 0;
                switch (type) {
                    case 'old':
                        tdofsset = 2;
                        break;
                    case 'new':
                        tdofsset = 3;
                        break;
                }
                $('#outputtable tbody tr:eq(' + (row.id) + ') td:eq(' + (tdofsset) + ')').text(item[3]);
                //prevent also pushing new row
                rowupdated = true;
            }
        };
        
        //push new row
        if (rowupdated == false) {
            //append array
            table.push({
                id: table.length,
                obj: item[1],
                var: item[2],
                [type]: item[3]
            });
            //append html table
            switch (type) {
                case 'old':
                    $('#outputtable tbody').append('<tr><td>' + item[1] + '</td><td>' + item[2] + '</td><td>' + item[3] + '</td><td></td><td></td><td></td></tr>');
                    break;
                case 'new':
                    $('#outputtable tbody').append('<tr><td>' + item[1] + '</td><td>' + item[2] + '</td><td></td><td>' + item[3] + '</td><td></td><td></td></tr>');
                    break;
            }
        }
    });
    //update table row classes
    if (initialtablelength > 0) {
        setTimeout(function() { setLoadingScreen('Gegevens verwerken...'); }, 10);
        setTimeout(function() { setRowClasses(); }, 200);
        setTimeout(function() { setLoadingScreen(null); }, 300);
    }
}

/*
* Parse table and set classes according to value content
*/
function setRowClasses() {
    //loop table rows
    $('#outputtable tbody > tr').each(function(index, tr) {
        //get values
        let oldval = $('#outputtable tbody tr:eq(' + (index) + ') td:eq(2)').html();
        let newval = $('#outputtable tbody tr:eq(' + (index) + ') td:eq(3)').html();
        
        //check if there is a difference and mark it
        if ((oldval == '') && (newval == '')) {
            $('#outputtable tbody tr:eq(' + (index) + ')').removeClass().addClass('val-empty');
            $('#outputtable tbody tr:eq(' + (index) + ') td:eq(4)').html('leeg');
        }
        else if (oldval == newval) {
            $('#outputtable tbody tr:eq(' + (index) + ')').removeClass().addClass('val-eq');
            $('#outputtable tbody tr:eq(' + (index) + ') td:eq(4)').html('nee');
        }
        else if (oldval != newval) {
            $('#outputtable tbody tr:eq(' + (index) + ')').removeClass().addClass('val-neq');
            $('#outputtable tbody tr:eq(' + (index) + ') td:eq(4)').html('ja');
        }
        else {
            $('#outputtable tbody tr:eq(' + (index) + ')').removeClass().addClass('val-err');
            $('#outputtable tbody tr:eq(' + (index) + ') td:eq(4)').html('fout');
        }
    });
}

/*
* document ready
*/
$(function() {
    /*
    * editable comment field
    */
    $('#outputtable tbody').on('click', 'td:nth-child(6)', function() {
        //check if there is an input and if not add it
        if (!$(this).children('input').length) {
            //add input
            $(this).html('<input type="text" value="' + $(this).text() + '">');
            $('#outputtable tbody').on('blur', 'input', function() {
                //for some reason this is called twice
                if ($(this).parents('tr').index() >= 0) {
                    //update table
                    if ($(this).val().length > 0) {
                        //insert new value
                        table[($(this).parents('tr').index())].comment = $(this).val();
                    }
                    else {
                        //remove property from object if empty, as to not have empty values in the output
                        delete table[($(this).parents('tr').index())].comment;
                    }
                    //remove input
                    $(this).parent().text($(this).val());
                }
            });
        }
        //set focus
        $(this).children('input').focus();
    });
});

 /*
 * load saved file
 */
 function loadSavedFile (json) {
    //clear table
    newButtonClickHandle();
    //import
    try {
        let res = JSON.parse(json);
        res.forEach((item) => {
            //append array
            table.push({
                id: table.length,
                obj: item.obj,
                var: item.var,
                ...(typeof item.old !== 'undefined') && {old: item.old},
                ...(typeof item.new !== 'undefined') && {new: item.new},
                ...(typeof item.comment !== 'undefined') && {comment: item.comment}
            });
            //append html table
            $('#outputtable tbody').append('<tr><td>' + item.obj + '</td><td>' + item.var + '</td><td>' + ((typeof item.old !== 'undefined') ? item.old : '') + '</td><td>' + ((typeof item.new !== 'undefined') ? item.new : '') + '</td><td></td><td>' + ((typeof item.comment !== 'undefined') ? item.comment : '') + '</td></tr>');
        });
    } 
    catch (e) {
        console.log(e);
        return false;
    }
    return true;
}