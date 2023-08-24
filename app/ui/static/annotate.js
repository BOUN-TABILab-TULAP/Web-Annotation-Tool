
// On document load
window.onload = function () {
    // paste as plain text
    document.addEventListener('paste', function(e) { e.preventDefault(); document.activeElement.innerHTML = e.clipboardData.getData('text/plain'); });

    window.CSRF_TOKEN = document.getElementsByName('csrfmiddlewaretoken')[0];
    window.sent_id = document.getElementById('sentence.sent_id').innerHTML;
    window.text = document.getElementById('sentence.text').innerHTML;
    window.cells = JSON.parse(document.getElementById('annotation.cats').innerHTML);
    window.notes = document.getElementById('annotation.notes').innerHTML;
    window.annotation_status = parseInt(document.getElementById('annotation.status').innerHTML);
    window.status_d = { 0: "New", 1: "Draft", 2: "Complete" };
    window.errors = document.getElementById('errors').innerHTML;
    window.graph_preference = parseInt(document.getElementById('graph_preference').innerHTML);
    // window.graph_d = { 0: "None", 1: "conllu.js", 2: "treex", 3: "spacy" };
    window.graph_d = { 0: "None", 1: "conllu.js" };
    window.root_path = document.getElementById('root_path').innerHTML;
    let error_condition_t = document.getElementById('error_condition').innerHTML;
    if (error_condition_t == "1") window.error_condition = 1;
    else window.error_condition = 0;
    window.current_columns = document.getElementById('current_columns').innerHTML.replace('[', '').replace(']', '').replaceAll("'", '').split(', '); // splitting list coming from preferences
    for (let i = 0; i < current_columns.length; i++) {
        current_columns[i] = current_columns[i].toLowerCase();
    }
    $('#sent_id').remove();
    $('#text').remove();
    $('#cells').remove();
    $('#notes').remove();
    $('#errors').remove();
    $('#graph_preference').remove();
    $('#error_condition').remove();
    $('#current_columns').remove();
    let cells_keys = get_sorted_cells_keys();
    for (let i = 0; i < cells_keys.length; i++) {
        let feats = window.cells[cells_keys[i]]['feats'];
        if (feats != '_') {
            feats = feats.split('|');
            for (let j = 0; j < feats.length; j++) {
                let matches = feats[j].match(/(.+)=(.+)/);
                if (matches != null) {
                    let column = matches[1].toLowerCase();
                    window.cells[cells_keys[i]][column] = matches[2];
                }
            }
        }
    }
    window.initial_cells = JSON.parse(JSON.stringify(window.cells)); // deep copy
    window.edits = []; // use for undo, redos
    window.edits_undone = [];
    window.last_focus = null;
    window.last_focus_value = null;
    init_page();
};

function get_data_changed() {
    let cells_keys = Object.keys(window.cells);
    let initial_cells_keys = Object.keys(window.initial_cells);
    if (cells_keys.length != initial_cells_keys.length) return true;
    for (let i = 0; i < cells_keys.length; i++) {
        if (cells_keys[i] != initial_cells_keys[i]) return true;

        for (let j = 0; j < cats_low.length; j++) {
            if (window.cells[cells_keys[i]][cats_low[j]] != window.initial_cells[initial_cells_keys[i]][cats_low[j]]) {
                return true;
            }
        }
    }
    return false;
}

function post_to_save(type, number) {

    // current columns can be sent for continuing with the same set
    // type should be sent for next, prev, or just save
    let form = document.createElement('form');
    form.method = "post";
    form.action = `${get_sentence_id_url()}`;
    form.enctype = "multipart/form-data";
    let csrf_token_input = document.getElementsByName('csrfmiddlewaretoken')[0];
    form.append(csrf_token_input);

    // Type
    let input = document.createElement('input');
    input.type = 'hidden';
    input.name = "type";
    input.value = type;
    form.append(input);
    if (type == "go") {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = "number";
        input.value = parseInt(number);
        form.append(input);
    }

    // Cells
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = "data";
    input.value = JSON.stringify(window.cells);
    form.append(input);
    document.body.append(form);

    // Data Changed
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = "data_changed";
    input.value = get_data_changed();
    form.append(input);
    document.body.append(form);

    // Notes
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = "notes";
    input.value = window.notes;
    form.append(input);
    document.body.append(form);

    // Status
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = "status";
    input.value = window.annotation_status;
    form.append(input);
    document.body.append(form);

    // Error condition
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = "error_condition";
    input.value = window.error_condition;
    form.append(input);
    document.body.append(form);

    // Graph preference
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = "graph_preference";
    input.value = window.graph_preference;
    form.append(input);
    document.body.append(form);

    // Current columns
    input = document.createElement('input');
    input.type = 'hidden';
    input.name = "current_columns";
    input.value = current_columns;
    form.append(input);
    document.body.append(form);

    form.submit();
}

function get_sentence_id_url() {
    var url = window.location.href;
    let matches = url.match(/\/(\d+$)/);
    return parseInt(matches[1]);
}

function get_sorted_cells_keys() {
    let cells_keys = Object.keys(window.cells);
    let new_list = [];
    for (let i = 1; i < cells_keys.length * 2; i++) {
        if (cells_keys.indexOf(`${i}-${i + 1}`) != -1) new_list.push(`${i}-${i + 1}`);
        if (cells_keys.indexOf(`${i}`) != -1) new_list.push(`${i}`);
    }
    return new_list;
}

const split_editable_list = ["form", "misc"];

function button_handle(type, number, way) {
    if (["previous", "next", "save"].includes(type)) {
        post_to_save(type);
    }
    else if (type == "col_add_rm_button") {
        let sel = document.getElementById("col_add_rm_select");
        let opts = sel.options;
        for (let i = 0; i < opts.length; i++) {
            if (opts[i].selected) column_change(opts[i].text.toLowerCase());
        }
    }
    else if (type == "do") {
        let input_number = "";
        let selected = "";
        if (["up", "down"].includes(way)) {
            if (way == "up") selected = "Add row";
            else if (way == "down") selected = "Remove row";
            input_number = number;
        }
        else {
            let sel = document.getElementById("row_select_select");
            selected = sel.options[sel.selectedIndex].text;
            input_number = document.getElementById("row_select_input").value;
        }
        if (input_number == "") return;
        if (selected == "Go to sentence") {
            post_to_save("go", input_number);
        }
        else if (["Add row", "Remove row"].includes(selected)) {
            if (number != undefined) {
                input_number = number;
                if (way == "down") selected = "Add row";
                else if (way == "up") selected = "Remove row";
            }
            let cells_keys = get_sorted_cells_keys();
            if (!cells_keys.includes(input_number)) return;
            let row_place = cells_keys.indexOf(input_number);
            if (selected == "Add row") {
                if (input_number.includes('-')) return;
                let first_num = parseInt(input_number);
                if (first_num == NaN) return;
                for (let i = 0; i <= row_place; i++) {
                    let key_t = cells_keys[i];
                    let key_num = parseInt(key_t);
                    if (!key_t.includes('-')) {
                        let head_t = window.cells[`${key_num}`]['head'];
                        if (head_t != '_') {
                            let head_num = parseInt(head_t);
                            if (head_num > first_num) window.cells[`${key_num}`]['head'] = `${head_num + 1}`;
                        }
                    }
                }
                for (let i = cells_keys.length - 1; i > row_place; i--) {
                    let key_t = cells_keys[i];
                    let key_num = parseInt(key_t);
                    if (key_t.includes('-')) {
                        window.cells[`${key_num + 1}-${key_num + 2}`] = { ...window.cells[key_t] };
                        delete window.cells[key_t];
                    }
                    else {
                        window.cells[`${key_num + 1}`] = { ...window.cells[key_t] };
                        let head_t = window.cells[`${key_num + 1}`]['head'];
                        if (head_t != '_') {
                            let head_num = parseInt(head_t);
                            if (head_num >= first_num) window.cells[`${key_num + 1}`]['head'] = `${head_num + 1}`;
                        }
                    }
                }
                window.cells[`${first_num}-${first_num + 1}`] = { ...window.cells[input_number] };
                new_row_keys = Object.keys(window.cells[`${first_num}-${first_num + 1}`]);
                for (let i = 0; i < new_row_keys.length; i++) {
                    if (!split_editable_list.includes(new_row_keys[i])) {
                        window.cells[`${first_num}-${first_num + 1}`][new_row_keys[i]] = '_';
                    }
                }
                window.cells[`${first_num + 1}`] = { ...window.cells[input_number] };
            }
            else if (selected == "Remove row") {
                let new_key = "";
                if (input_number.includes('-')) delete window.cells[input_number];
                else {
                    for (let i = row_place; i < cells_keys.length - 1; i++) {
                        let key = cells_keys[i + 1];
                        if (key.includes('-')) {
                            let first_num = parseInt(key);
                            new_key = `${first_num - 1}-${first_num}`;
                        }
                        else new_key = `${parseInt(key) - 1}`;
                        window.cells[new_key] = window.cells[cells_keys[i + 1]];
                        delete window.cells[cells_keys[i + 1]];
                    }
                    delete window.cells[cells_keys[cells_keys.length - 1]];
                }
            }
            inject_sentence();
        }
    }
    else if (type == "undo") {
        if (window.edits.length == 0) return;
        let last_edit = window.edits.pop();
        let undone_pair = [last_edit[0], window.cells[last_edit[0][0]][last_edit[0][1]]];
        window.edits_undone.push(undone_pair);
        window.cells[last_edit[0][0]][last_edit[0][1]] = last_edit[1];
        inject_sentence();
    }
    else if (type == "redo") {
        if (window.edits_undone.length == 0) return;
        let last_edit_undone = window.edits_undone.pop();
        let redone_pair = [last_edit_undone[0], window.cells[last_edit_undone[0][0]][last_edit_undone[0][1]]];
        window.edits.push(redone_pair);
        window.cells[last_edit_undone[0][0]][last_edit_undone[0][1]] = last_edit_undone[1];
        inject_sentence();
    }
    else if (type == "reset") {
        window.cells = window.initial_cells;
        inject_sentence();
    }
    else if (type == "profile") {
        post_to_save(type);
    }
    else if (type == "errors") {
        let button = $('button#errors')[0];
        if (window.error_condition == 0) {
            window.error_condition = 1;
            display_errors();
            $('#error_div')[0].hidden = false;
            let img = $('#exclamation-square-fill')[0].cloneNode(true);
            img.hidden = false;
            $('button#errors').find('img')[0].remove();
            button.append(img);
            button.setAttribute('title', 'Hide errors');
        }
        else if (window.error_condition == 1) {
            $('#error_div')[0].hidden = true;
            let img = $('#exclamation-square')[0].cloneNode(true);
            img.hidden = false;
            $('button#errors').find('img')[0].remove();
            button.append(img);
            button.setAttribute('title', 'Show errors');
            window.error_condition = 0;
        }
    }
    else if (type == "graph") {
        let select = $('select#graph')[0];
        let selected = select.options[select.selectedIndex].text;
        let options = $('select#graph').find('option');
        for (let i = 0; i < options.length; i++) {
            if (options[i].innerHTML == selected) options[i].classList.add("text-muted");
            else options[i].classList.remove("text-muted");
        }
        if (selected == window.graph_d[0]) window.graph_preference = 0;
        else if (selected == window.graph_d[1]) window.graph_preference = 1;
        else if (selected == window.graph_d[2]) window.graph_preference = 2;
        else if (selected == window.graph_d[3]) window.graph_preference = 3;
        create_graph();
    }
}

// Keyboard shortcuts
document.onkeyup = function (e) {
    if (e.key.toLowerCase() == "p" && e.altKey) {
        button_handle("previous");
    }
    else if (e.key.toLowerCase() == "r" && e.altKey) {
        button_handle("reset");
    }
    else if (e.key.toLowerCase() == "d" && e.altKey) {
        button_handle("do");
    }
    else if (e.key.toLowerCase() == "x" && e.altKey) {
        document.getElementById("col_add_rm_select").focus();
    }
    else if (e.key.toLowerCase() == "c" && e.altKey) {
        button_handle("col_add_rm_button");
    }
    else if (e.key.toLowerCase() == "n" && e.altKey) {
        button_handle("next");
    }
    else if (e.key.toLowerCase() == "s" && e.altKey) {
        button_handle("save");
    }
    else if (e.key.toLowerCase() == "t" && e.altKey) {
        document.getElementById("1 form").focus();
    }
    else if ((e.key == "ArrowUp" || e.key == "ArrowDown" || e.key == "ArrowLeft" || e.key == "ArrowRight") && e.shiftKey) {
        if (!document.getElementById('word_lines').contains(document.activeElement)) return;
	if (e.altKey) {
		if (e.key == "ArrowUp") {
		    button_handle("do", document.activeElement.id.split(' ')[0], "up");
		}
		else if (e.key == "ArrowDown") {
		    button_handle("do", document.activeElement.id.split(' ')[0], "down");
		}
	}
	else {
		let matches = document.activeElement.id.match(/(.+) (.+)/);
		if (matches.length == 3) {
		    let cells_keys = get_sorted_cells_keys();
		    let row_id = cells_keys.indexOf(matches[1]);
		    let column_order = current_columns.indexOf(matches[2]);

		    let form_count = document.getElementById("word_lines").getElementsByTagName("tr").length - 1;
		    if (e.key == "ArrowUp" && row_id != 0) {
			document.getElementById(`${cells_keys[row_id - 1]} ${matches[2]}`).focus();
		    }
		    else if (e.key == "ArrowDown" && row_id != form_count - 1) {
			document.getElementById(`${cells_keys[row_id + 1]} ${matches[2]}`).focus();
		    }
		    else if (e.key == "ArrowRight" && column_order != current_columns.length - 1) {
			document.getElementById(`${matches[1]} ${current_columns[column_order + 1]}`).focus();
		    }
		    else if (e.key == "ArrowLeft" && column_order != 0) {
			document.getElementById(`${matches[1]} ${current_columns[column_order - 1]}`).focus();
		    }
		}
	}
    }
};

function column_change(column_option) {
    if (current_columns.includes(column_option)) {
        current_columns.splice(current_columns.indexOf(column_option), 1);
        if (cats_low.includes(column_option)) $(`option:contains('${cats[cats_low.indexOf(column_option)]}')`)[0].classList.remove("text-muted");
        else $(`option:contains('${features[features_low.indexOf(column_option)]}')`)[0].classList.remove("text-muted");
    }
    else {
        current_columns = current_columns.concat(column_option);
        if (cats_low.includes(column_option)) $(`option:contains('${cats[cats_low.indexOf(column_option)]}')`)[0].classList.add("text-muted");
        else $(`option:contains('${features[features_low.indexOf(column_option)]}')`)[0].classList.add("text-muted");
    }
    sort_columns();
    inject_sentence();
}

function sort_columns() {
    for (let i = 0; i < cats.length; i++) {
        let cat_t = cats_low[i];
        if (current_columns.includes(cat_t)) {
            current_columns.splice(current_columns.indexOf(cat_t), 1);
            current_columns = current_columns.concat(cat_t);
        }
    }
    for (let i = 0; i < features.length; i++) {
        let feat_t = features_low[i];
        if (current_columns.includes(feat_t)) {
            current_columns.splice(current_columns.indexOf(feat_t), 1);
            current_columns = current_columns.concat(feat_t);
        }
    }
}

function init_page() {

    let div_cont = document.createElement('div');
    div_cont.className = 'input-group d-flex';
    let div_row = document.createElement('div');
    div_row.className = 'row mx-auto';
    let div_bottom_cont = document.createElement('div');
    div_bottom_cont.className = 'input-group d-flex';
    let div_bottom_row = document.createElement('div');
    div_bottom_row.className = 'row';
    let div_status_cont = document.createElement('div');
    div_status_cont.className = 'input-group d-flex';
    let div_status_row = document.createElement('div');
    div_status_row.className = 'row';

    // create button for profile
    let div_col = document.createElement('div');
    div_col.className = 'col-md-auto';
    let button = document.createElement("button");
    button.id = "profile";
    button.innerHTML = "Profile";
    div_col.append(button);
    div_row.append(div_col);

    // previous-next button group
    div_col = document.createElement('div');
    div_col.className = 'col-md-auto';
    let btn_group = document.createElement('div');
    btn_group.className = 'btn-group';
    div_col.append(btn_group);

    // previous
    button = document.createElement("button");
    button.id = "previous";
    let img = $('#arrow-left')[0].cloneNode(true);
    img.hidden = false;
    button.setAttribute('data-bs-toggle', 'tooltip');
    button.setAttribute('data-bs-placement', 'bottom');
    button.setAttribute('title', 'Go to the previous sentence');
    button.append(img);
    btn_group.append(button);

    // next
    button = document.createElement("button");
    button.id = "next";
    img = $('#arrow-right')[0].cloneNode(true);
    img.hidden = false;
    button.append(img);
    button.setAttribute('data-bs-toggle', 'tooltip');
    button.setAttribute('data-bs-placement', 'bottom');
    button.setAttribute('title', 'Go to the next sentence');
    btn_group.append(button);
    div_row.append(div_col);

    // reset-undo-redo button group
    div_col = document.createElement('div');
    div_col.className = 'col-md-auto';
    btn_group = document.createElement('div');
    btn_group.className = 'btn-group';
    div_col.append(btn_group);

    // reset
    button = document.createElement("button");
    button.id = "reset";
    img = $('img#x')[0].cloneNode(true);
    img.hidden = false;
    button.setAttribute('data-bs-toggle', 'tooltip');
    button.setAttribute('data-bs-placement', 'bottom');
    button.setAttribute('title', 'Reset edits');
    button.append(img);
    btn_group.append(button);

    // undo
    button = document.createElement("button");
    button.id = "undo";
    img = $('img#arrow-counterclockwise')[0].cloneNode(true);
    img.hidden = false;
    button.setAttribute('data-bs-toggle', 'tooltip');
    button.setAttribute('data-bs-placement', 'bottom');
    button.setAttribute('title', 'Undo edits');
    button.append(img);
    btn_group.append(button);

    // redo
    button = document.createElement("button");
    button.id = "redo";
    img = $('img#arrow-clockwise')[0].cloneNode(true);
    img.hidden = false;
    button.setAttribute('data-bs-toggle', 'tooltip');
    button.setAttribute('data-bs-placement', 'bottom');
    button.setAttribute('title', 'Redo edits');
    button.append(img);
    btn_group.append(button);
    div_row.append(div_col);

    // input-group
    div_col = document.createElement('div');
    div_col.className = 'col-md-auto';
    let input_group = document.createElement('div');
    input_group.className = 'input-group';
    div_col.append(input_group);

    // do_input
    let input = document.createElement("input");
    input.type = "text";
    input.id = "row_select_input";
    input.className = "form-control form-control-sm";
    input_group.append(input);

    // do_select
    let select = document.createElement("select");
    select.id = "row_select_select";
    select.className = "form-select form-select-sm";
    let options = ["Go to sentence", "Add row", "Remove row"];
    for (let i = 0; i < options.length; i++) {
        let option = document.createElement("option");
        option.innerHTML = options[i];
        select.append(option);
    }
    input_group.append(select);

    // do_button
    button = document.createElement("button");
    button.id = "do";
    img = $('#check')[0].cloneNode(true);
    img.hidden = false;
    button.append(img);
    input_group.append(button);
    div_row.append(div_col);

    // input-group
    div_col = document.createElement('div');
    div_col.className = 'col-md-auto';
    input_group = document.createElement('div');
    input_group.className = 'input-group';
    div_col.append(input_group);

    let text = document.createElement('span');
    text.innerHTML = "Status:";
    input_group.append(text);

    // status_select
    select = document.createElement("select");
    select.id = "status";
    select.className = "form-select form-select-sm";
    select.addEventListener('change', (event) => {
        let selected = event.target.value;
        let options = $('select#status').find('option');
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) options[i].classList.add("text-success");
            else options[i].classList.remove("text-success");
        }
        if (selected == window.status_d[0]) window.annotation_status = 0;
        else if (selected == window.status_d[1]) window.annotation_status = 1;
        else if (selected == window.status_d[2]) window.annotation_status = 2;
    });
    options = [];
    let status_keys = Object.keys(window.status_d);
    for (let i = 0; i < status_keys.length; i++) {
        options.push(window.status_d[parseInt(status_keys[i])]);
    }
    for (let i = 0; i < options.length; i++) {
        option = document.createElement("option");
        option.innerHTML = options[i];
        if (window.annotation_status == i) {
            option.selected = true;
            option.classList.add("text-success");
        }
        else {
            option.classList.remove("text-success");
        }
        select.append(option);
    }
    input_group.append(select);
    div_status_row.append(div_col);

    // errors
    div_col = document.createElement('div');
    div_col.className = 'col';
    button = document.createElement("button");
    button.id = "errors";
    button.setAttribute('data-bs-toggle', 'tooltip');
    button.setAttribute('data-bs-placement', 'bottom');
    if (window.error_condition == 1) {
        img = $('#exclamation-square-fill')[0].cloneNode(true);
        button.setAttribute('title', 'Hide errors');
    }
    else if (window.error_condition == 0) {
        img = $('#exclamation-square')[0].cloneNode(true);
        button.setAttribute('title', 'Show errors');
    }
    img.hidden = false;
    button.append(img);
    div_col.append(button);
    div_bottom_row.append(div_col);

    // input-group
    div_col = document.createElement('div');
    div_col.className = 'col-md-auto';
    input_group = document.createElement('div');
    input_group.className = 'input-group';
    div_col.append(input_group);

    // graph_select
    select = document.createElement("select");
    select.id = "graph";
    select.className = "form-select form-select-sm";
    option = document.createElement("option");
    option.disabled = true;
    option.selected = true;
    option.innerHTML = "Graphs";
    select.append(option);
    options = [];
    let graph_keys = Object.keys(window.graph_d);
    for (let i = 0; i < graph_keys.length; i++) {
        options.push(window.graph_d[parseInt(graph_keys[i])]);
    }
    for (let i = 0; i < options.length; i++) {
        option = document.createElement("option");
        option.innerHTML = options[i];
        if (window.graph_preference == i) {
            option.classList.add("text-muted");
        }
        else {
            option.classList.remove("text-muted");
        }
        select.append(option);
    }
    input_group.append(select);

    // graph_button
    button = document.createElement("button");
    button.id = "graph";
    img = $('#check')[0].cloneNode(true);
    img.hidden = false;
    button.append(img);
    input_group.append(button);
    div_bottom_row.append(div_col);

    // input-group
    div_col = document.createElement('div');
    div_col.className = 'col-md-auto';
    input_group = document.createElement('div');
    input_group.className = 'input-group';
    div_col.append(input_group);

    // column_select
    select = document.createElement("select");
    select.id = "col_add_rm_select";
    select.className = "form-select form-select-sm";
    // select.multiple = true;
    option = document.createElement("option");
    option.disabled = true;
    option.selected = true;
    option.innerHTML = "Columns";
    select.append(option);
    let cats_no_id = [...cats];
    cats_no_id.shift();
    options = cats_no_id.concat(features);
    for (let i = 0; i < options.length; i++) {
        option = document.createElement("option");
        option.innerHTML = options[i];
        if (current_columns.includes(options[i].toLowerCase())) option.classList.add("text-muted"); // not working in firefox
        else option.classList.remove("text-muted");
        select.append(option);
    }
    input_group.append(select);

    // column_button
    button = document.createElement("button");
    button.id = "col_add_rm_button";
    img = $('#check')[0].cloneNode(true);
    img.hidden = false;
    button.append(img);
    input_group.append(button);
    div_row.append(div_col);

    // save
    div_col = document.createElement('div');
    div_col.className = 'col';
    button = document.createElement("button");
    button.id = "save";
    img = $('#save')[0].cloneNode(true);
    img.hidden = false;
    button.setAttribute('data-bs-toggle', 'tooltip');
    button.setAttribute('data-bs-placement', 'bottom');
    button.setAttribute('title', 'Save edits');
    button.append(img);
    div_col.append(button);
    div_row.append(div_col);

    // info
    div_col = document.createElement('div');
    div_col.className = 'col';
    button = document.createElement("button");
    img = $('#info')[0].cloneNode(true);
    img.hidden = false;
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#infoModal');
    button.setAttribute('data-bs-placement', 'bottom');
    button.setAttribute('title', 'Info');
    button.className = "btn btn-light btn-sm border";
    button.append(img);
    div_col.append(button);
    div_row.append(div_col);

    div_cont.append(div_row);
    $('div#buttons')[0].append(div_cont);
    div_bottom_cont.append(div_bottom_row);
    $('div#bottom-buttons')[0].append(div_bottom_cont);
    div_status_cont.append(div_status_row);
    $('div#status')[0].append(div_status_cont);

    let buttons = document.getElementsByTagName("button");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function () {
            button_handle(buttons[i].id);
        });
        buttons[i].className = "btn btn-light btn-sm border";
    }

    inject_sentence();
}

var cats = ["ID", "FORM", "LEMMA", "UPOS", "XPOS", "FEATS", "HEAD", "DEPREL", "DEPS", "MISC"];
var cats_low = [];
cats.forEach(function (item) {
    cats_low.push(item.toLowerCase());
});
var features = ["Abbr", "Animacy", "Aspect", "Case", "Clusivity", "Definite", "Degree", "Evident", "Foreign", "Gender", "Mood", "NounClass", "Number", "NumType", "Person", "Polarity", "Polite", "Poss", "PronType", "Reflex", "Tense", "Typo", "VerbForm", "Voice"];
var features_low = [];
features.forEach(function (item) {
    features_low.push(item.toLowerCase());
});
const all_column_count = cats.length + features.length;

function inject_sentence() {
    $('br').remove();
    $('#sentence_text').remove();
    $('#word_lines').remove();
    let cells = window.cells;

    // Show sentence in table form with indices
    let sentence_text = document.createElement("table");
    sentence_text.id = "sentence_text";
    sentence_text.className = "table-sm border border-secondary";
    let tbody = document.createElement("tbody");
    let row1 = document.createElement("tr");
    let row2 = document.createElement("tr");
    let cells_keys = get_sorted_cells_keys();
    let form_count = cells_keys.length;
    for (let i = 0; i < form_count; i++) {
        if (cells_keys[i].indexOf('-') != -1) continue;
        let heading = document.createElement("td");
        heading.innerHTML = cells_keys[i];
        heading.style = "text-align: center;";
        heading.classList.add("text-muted");
        let data = document.createElement("td");
        data.innerHTML = cells[cells_keys[i]]["form"];
        data.style = "text-align: center;";
        row1.append(data);
        row2.append(heading);
    }
    tbody.append(row1);
    tbody.append(row2);
    sentence_text.append(tbody);
    let nav_table1 = $('nav#table1')[0];
    nav_table1.append(sentence_text);

    // Show table
    let word_lines = document.createElement("table");
    word_lines.id = "word_lines";
    word_lines.className = "table table-sm border border-secondary";
    let thead = document.createElement("thead");
    tbody = document.createElement("tbody");
    word_lines.append(thead);
    word_lines.append(tbody);
    let row = document.createElement("tr");
    for (let i = 0; i < current_columns.length; i++) {
        let heading = document.createElement("th");
        let column_t = current_columns[i].toLowerCase();
        if (cats_low.includes(column_t)) heading.innerHTML = cats[cats_low.indexOf(column_t)];
        else heading.innerHTML = features[features_low.indexOf(column_t)];
        row.append(heading);
    }
    thead.append(row);

    for (let i = 0; i < form_count; i++) {
        let feats = cells[cells_keys[i]]['feats'].split('|');
        if (feats != '_') {
            for (let j = 0; j < feats.length; j++) {
                let matches = feats[j].match(/(.+)=(.+)/);
                if (matches == null) continue;
                let column = matches[1].toLowerCase();
                cells[cells_keys[i]][column] = matches[2];
            }
        }
        let row = document.createElement("tr");
        for (let j = 0; j < current_columns.length; j++) {
            let column_t = current_columns[j].toLowerCase();
            let row_t = cells_keys[i];
            let data = document.createElement("td");
            if (column_t == "id") data.innerHTML = row_t;
            else if (cells[row_t][column_t] == undefined) data.innerHTML = "_";
            else data.innerHTML = cells[row_t][column_t];
            data.id = `${row_t} ${column_t}`;
            data.contentEditable = true;
            if (column_t == "id") data.contentEditable = false;
            else if (row_t.indexOf('-') != -1 && !split_editable_list.includes(column_t)) data.contentEditable = false;
            data.addEventListener("focus", (event) => {
                window.last_focus = [row_t, column_t];
                window.last_focus_value = event.target.innerHTML;
                if (event.target.innerHTML == "_") event.target.innerHTML = "";
            });
            data.addEventListener("blur", (event) => {

            })
            if (['aspect', 'case', 'evident', 'mood', 'number', 'number[psor]', 'numtype', 'person', 'person[psor]', 'polarity', 'prontype', 'tense', 'verbform', 'voice', 'upos', 'xpos', 'deprel'].includes(column_t)) {
                data.classList.add("autocomplete");
                data.classList.add(column_t);
            }
            data.addEventListener("blur", (event) => { // potential problem with unfocusing after column removal!
                if (window.last_focus_value != event.target.innerHTML) {
                    cell_change(row_t, column_t, event.target.innerHTML);
                    window.edits.push([window.last_focus, window.last_focus_value]);
                    display_errors();
                }
            });
            row.append(data);
        }
        tbody.append(row);
    }
    $('div#table2')[0].append(word_lines);

    // autocomplete
    let autocomplete_d = { 'Aspect': ['Gen', 'Hab', 'Imp', 'Perf', 'Prog', 'Prosp'], 'Case': ['Abl', 'Acc', 'Dat', 'Equ', 'Gen', 'Ins', 'Nom', 'Loc', 'Voc'], 'Evident': ['Fh', 'Nfh'], 'Mood': ['Cnd', 'Des', 'Dur', 'Gen', 'Imp', 'Ind', 'Nec', 'Opt', 'Pot', 'Rapid'], 'Number': ['Sing', 'Plur'], 'Number[psor]': ['Sing', 'Plur'], 'NumType': ['Card', 'Dist', 'Frac', 'Ord'], 'Person': ['1', '2', '3'], 'Person[psor]': ['1', '2', '3'], 'Polarity': ['Pos', 'Neg'], 'PronType': ['Dem', 'Ind', 'Int', 'Loc', 'Prs', 'Rcp', 'Rfl', 'Quant'], 'Tense': ['Past', 'Pres', 'Fut'], 'VerbForm': ['Conv', 'Part', 'Vnoun'], 'Voice': ['Cau', 'Pass', 'Rcp', 'Rfl'], 'DEPREL': ['acl', 'advcl', 'advlc:cond', 'advmod', 'advmod:emph', 'amod', 'case', 'cc', 'cc:preconj', 'compound', 'compound:lvc', 'compound:redup', 'conj', 'cop', 'csubj', 'det', 'dep', 'dep:der', 'discourse', 'discourse:q', 'discourse:tag', 'flat', 'iobj', 'nmod', 'nmod:part', 'nmod:poss', 'nsubj', 'nummod', 'obl', 'obl:cl', 'obl:comp', 'obl:tmod', 'obj', 'punct', 'root', 'xcomp'], 'UPOS': ['ADJ', 'ADP', 'ADV', 'AUX', 'CCONJ', 'DET', 'INTJ', 'NOUN', 'NUM', 'PART', 'PRON', 'PROPN', 'PUNCT', 'VERB'], 'XPOS': ['Adj', 'ANum', 'Attr', 'Comma', 'Conv', 'Det', 'Demons', 'Exist', 'Indef', 'Inst', 'NNum', 'Noun', 'Partic', 'PCNom', 'PCDat', 'PCGen', 'Pers', 'Place', 'Ptcp', 'Punc', 'Reflex', 'Separ', 'Stop', 'TDots', 'Topic', 'Typo', 'Ques', 'Quant', 'Verb', 'Vnoun', 'Year', 'Zero'] };
    let ac_keys = Object.keys(autocomplete_d);
    for (let i = 0; i < ac_keys.length; i++) {
        let source_t = autocomplete_d[ac_keys[i]];
        $(`.autocomplete.${ac_keys[i].toLowerCase()}`).autocomplete({ source: source_t });
    }

    create_graph();
    display_errors();
}

function create_graph() {
    $('div#graph').empty();
    let div_graph = $('div#graph')[0];
    if (window.graph_preference == 0) return;
    else if (window.graph_preference == 1) {
        $('#vis').remove();
        $('#dep_graph').remove();
        let cells = window.cells;
        let vis = document.createElement('div');
        vis.id = "vis";
        let dep_graph = document.createElement('div');
        dep_graph.className = "conllu-parse";
        dep_graph.setAttribute('data-inputid', 'input');
        dep_graph.setAttribute('data-parsedid', 'parsed');
        dep_graph.setAttribute('data-logid', 'log');
        let order = ['form', 'lemma', 'upos', 'xpos', 'feats', 'head', 'deprel', 'deps']; // id & misc removed
        let cells_keys = get_sorted_cells_keys();
        for (let i = 0; i < cells_keys.length; i++) {
            let key = cells_keys[i];
            dep_graph.innerHTML += key + "\t";
            for (let j = 0; j < 8; j++) {
                dep_graph.innerHTML += cells[key][order[j]] + "\t";
            }
            dep_graph.innerHTML += cells[key]["misc"] + "\n"; // misc
        }
        div_graph.append(vis);
        div_graph.append(dep_graph);
        Annodoc.activate(Config.bratCollData, {});
        $('#embedded-1-sh').remove();
    }
    else if (window.graph_preference == 2) {
        $.post(`/${root_path}ud_graph/`,
            {
                cells: JSON.stringify(window.cells),
                sent_id: window.sent_id,
                text: window.text,
            },
            function (data) {
                let graph = document.createElement('div');
                graph.id = "ud_graph";
                let p = document.createElement('p');
                p.innerHTML = data;
                graph.innerHTML = p.textContent;
                div_graph.append(graph);
                $("#ud_graph").after($("#error_div"));
            });
    }
    else if (window.graph_preference == 3) {
        $.post(`/${root_path}spacy/`,
            {
                cells: JSON.stringify(window.cells)
            },
            function (data) {
                let textarea_t = document.createElement('textarea');
                textarea_t.innerHTML = data;
                let graph = document.createElement('div');
                graph.innerHTML = textarea_t.value;
                div_graph.append(graph);
            });
    }
}

function display_errors() {
    if (window.error_condition == 0) return;

    $('#error_div').remove();
    $('#error_header').remove();
    $('#error_body').remove();
    $.post(`/${window.root_path}error/`,
        {
            cells: JSON.stringify(window.cells),
            sent_id: window.sent_id,
            text: window.text,
        },
        function (data) {
            window.errors = data;
        });

    let error_div = document.createElement('div');
    error_div.id = "error_div";
    error_div.className = "card bg-light mb-3";
    error_div.style = "max-width: 100rem;";
    let error_header = document.createElement('div');
    error_div.append(error_header);
    error_header.id = "error_header";
    error_header.className = "card-header";
    error_header.innerHTML = 'Errors';
    let error_body = document.createElement('div');
    error_body.id = "error_body";
    error_body.className = "card-body";
    error_div.append(error_body);
    let errors = window.errors.split('\n');
    if (errors[0] == "") {
        error_div.classList.add("border-success");
        error_header.classList.add("border-success");
        errors[0] = 'Without error!';
    }
    else {
        error_div.classList.add("border-danger");
        error_header.classList.add("border-danger");
    }
    for (let i = 0; i < errors.length; i++) {
        error_body.innerHTML += errors[i];
        error_body.append(document.createElement('br'));
    }
    $('div#error')[0].append(error_div);
}

function feats_order(key) {
    let feats = window.cells[key]['feats'].split('|');
    if (feats.length == 1 && feats[0] == "_") return;
    let new_feats = "";
    let cols_d = {};
    for (let j = 0; j < feats.length; j++) {
        let matches = feats[j].match(/(.+)=(.+)/);
        if (matches.length == 3) cols_d[matches[1]] = matches[2];
    }
    d_keys = Object.keys(cols_d).sort();
    for (let j = 0; j < d_keys.length; j++) {
        let col_t = d_keys[j];
        let val_t = cols_d[col_t];
        if (val_t == "_") continue;
        new_feats += `${col_t}=${val_t}`;
        if (j != d_keys.length - 1) new_feats += "|";
    }
    if (new_feats == "") new_feats = "_";
    window.cells[key]['feats'] = new_feats;
    document.getElementById(`${key} feats`).innerHTML = new_feats;
}

function cell_change(key, column, cell) {
    cell = cell.replace('<br>', '');
    if (cell == '') {
        cell = '_';
        document.getElementById(`${key} ${column}`).innerHTML = cell;
    }
    window.cells[key][column] = cell;
    if (column == "feats") {
        let feats = cell.split('|');
        let feat_d = {};
        for (let j = 0; j < feats.length; j++) {
            let matches = feats[j].match(/(.+)=(.+)/);
            if (matches) {
                let column_t = matches[1].toLowerCase();
                window.cells[key][column_t] = matches[2];
                feat_d[column_t] = matches[2];
            }
        }
        let feat_keys = Object.keys(feat_d);
        for (let j = 0; j < current_columns.length; j++) {
            let column_t = current_columns[j].toLowerCase();
            if (feat_keys.includes(column_t)) {
                document.getElementById(`${key} ${column_t}`).innerHTML = feat_d[column_t];
            }
            else if (!cats_low.includes(column_t)) {
                document.getElementById(`${key} ${column_t}`).innerHTML = "_";
            }
        }
        feats_order(key);
    }
    else if (features_low.includes(column)) {
        let new_feats = "";
        let current_feats = {};
        let feats = window.cells[key]['feats'].split('|');
        for (let j = 0; j < feats.length; j++) {
            let matches = feats[j].match(/(.+)=(.+)/);
            if (matches && matches[2] != "_") {
                current_feats[matches[1]] = matches[2];
            }
        }
        current_feats[features[features_low.indexOf(column)]] = cell;
        let feats_l = Object.keys(current_feats);
        let new_feats_l = [];
        for (let j = 0; j < feats_l.length; j++)
            if (current_feats[feats_l[j]] != "_") new_feats_l.push(feats_l[j]);
        new_feats = new_feats_l.sort().map(function (x) { return `${x}=${current_feats[x]}`; }).join('|');
        if (new_feats == "") new_feats = "_";
        document.getElementById(`${key} feats`).innerHTML = new_feats;
        window.cells[key]['feats'] = new_feats;
    }
    create_graph();
    display_errors();
}
