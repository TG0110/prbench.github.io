(function () {
    function getLeaderboard(type) {
        return document.getElementById(type + "-leaderboard");
    }

    function setActiveButton(type) {
        var buttons = document.querySelectorAll(".leaderboard-tabs .tab-button");
        buttons.forEach(function (button) {
            var isActive = button.getAttribute("onclick") && button.getAttribute("onclick").indexOf("'" + type + "'") !== -1;
            button.classList.toggle("active", isActive);
        });
    }

    window.showLeaderboard = function (type) {
        var openSource = getLeaderboard("opensource");
        var commercial = getLeaderboard("commercial");

        if (!openSource || !commercial) return;

        openSource.classList.remove("active");
        commercial.classList.remove("active");

        var selected = getLeaderboard(type);
        if (selected) {
            selected.classList.add("active");
            setActiveButton(type);
        }
    };

    function cellValue(row, index) {
        var text = row.children[index] ? row.children[index].textContent.trim() : "";
        var normalized = text.replace(/,/g, "").replace(/^--$/, "");
        var numeric = parseFloat(normalized);
        if (normalized !== "" && !Number.isNaN(numeric)) return numeric;
        return text.toLowerCase();
    }

    function sortTable(table, columnIndex, direction) {
        var tbody = table.tBodies[0];
        if (!tbody) return;

        var rows = Array.prototype.slice.call(tbody.rows);
        rows.sort(function (a, b) {
            var av = cellValue(a, columnIndex);
            var bv = cellValue(b, columnIndex);

            if (typeof av === "number" && typeof bv !== "number") return direction === "asc" ? -1 : 1;
            if (typeof av !== "number" && typeof bv === "number") return direction === "asc" ? 1 : -1;
            if (av < bv) return direction === "asc" ? -1 : 1;
            if (av > bv) return direction === "asc" ? 1 : -1;
            return 0;
        });

        rows.forEach(function (row) {
            tbody.appendChild(row);
        });
    }

    document.querySelectorAll(".leaderboard-table").forEach(function (table) {
        table.querySelectorAll("thead th").forEach(function (th, index) {
            th.addEventListener("click", function () {
                var current = th.dataset.direction === "asc" ? "desc" : "asc";
                table.querySelectorAll("thead th").forEach(function (other) {
                    other.removeAttribute("data-direction");
                    other.classList.remove("active-sort");
                });
                th.dataset.direction = current;
                th.classList.add("active-sort");
                sortTable(table, index, current);
            });
        });
    });

    document.querySelectorAll("[data-copy-target]").forEach(function (button) {
        button.addEventListener("click", function () {
            var target = document.getElementById(button.dataset.copyTarget);
            if (!target || !navigator.clipboard) return;

            navigator.clipboard.writeText(target.innerText).then(function () {
                var original = button.textContent;
                button.textContent = "Copied";
                window.setTimeout(function () {
                    button.textContent = original;
                }, 1400);
            });
        });
    });

    window.showLeaderboard("opensource");
})();
