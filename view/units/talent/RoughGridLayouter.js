function layoutColumn(column, prevColumn) {
    function moveElement(array, oldIndex, newIndex) {
        const cut = array.splice(oldIndex, 1);

        if (oldIndex < newIndex) {
            newIndex--;
        }

        array.splice(newIndex, 0, cut[0]);
    }

    function doPass() {
        let j = 0;
        const jl = column.length;
        for (; j < jl; j++) {
            const talentView = column[j];
            const talent = talentView.model;
            const dependencies = talentView.dependcyTalents;
            let k = 0;
            const kl = dependencies.length;
            for (; k < kl; k++) {
                const dependency = dependencies[k];
                const dependencyIndex = prevColumn.indexOf(dependency);
                if (dependencyIndex !== -1) {
                    //found dependency in previous column
                    moveElement(column, j, dependencyIndex);
                    return true;
                }
            }
        }
        return false;
    }

    let passCount = 0;
    while (doPass()) {
        passCount++;
        if (passCount > 1000) {
            throw new Error("Failed layout");
        }
    }
}

function layoutColumns(columns) {
    //rearrange rows in columns to place dependent cells in the same rows as their dependency
    let prevColumn = columns[0];
    let i = 1;
    const il = columns.length;
    for (; i < il; i++) {
        const column = columns[i];
        layoutColumn(column, prevColumn);
        prevColumn = column;
    }
}