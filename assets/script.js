(function () {
    var sizeColumnIndex = 3;
    var activeSizeFilters = [];

    function cellValue(row, index) {
        var text = row.children[index] ? row.children[index].textContent.trim() : "";
        var normalized = text.replace(/,/g, "").replace(/^--$/, "");
        var numeric = parseFloat(normalized);
        if (normalized !== "" && !Number.isNaN(numeric)) return numeric;
        return text.toLowerCase();
    }

    function parseModelSize(row) {
        var text = row.children[sizeColumnIndex] ? row.children[sizeColumnIndex].textContent.trim() : "";
        if (text === "" || text === "--" || /^n\/?a$/i.test(text)) return null;

        var match = text.replace(/,/g, "").match(/([0-9]+(?:\.[0-9]+)?)/);
        if (!match) return null;
        return parseFloat(match[1]);
    }

    function matchesSizeRange(size, range) {
        if (range === "na") return size === null;
        if (size === null) return false;
        if (range === "lt4") return size < 4;
        if (range === "4-10") return size >= 4 && size < 10;
        if (range === "10-20") return size >= 10 && size < 20;
        if (range === "20-40") return size >= 20 && size < 40;
        if (range === "gte40") return size >= 40;
        return true;
    }

    function applySizeFilters() {
        document.querySelectorAll(".leaderboard-table tbody tr").forEach(function (row) {
            var size = parseModelSize(row);
            var isVisible = activeSizeFilters.length === 0 || activeSizeFilters.some(function (range) {
                return matchesSizeRange(size, range);
            });
            row.hidden = !isVisible;
        });

        document.querySelectorAll(".size-filter-cell").forEach(function (cell) {
            cell.classList.toggle("has-active-filter", activeSizeFilters.length > 0);
        });
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
        applySizeFilters();
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

    document.querySelectorAll(".size-filter-cell").forEach(function (cell) {
        var toggle = cell.querySelector(".size-filter-toggle");
        var menu = cell.querySelector(".size-filter-menu");
        var applyButton = cell.querySelector(".size-filter-apply");
        var resetButton = cell.querySelector(".size-filter-reset");
        var checkboxes = Array.prototype.slice.call(cell.querySelectorAll('input[type="checkbox"]'));

        if (!toggle || !menu || !applyButton || !resetButton) return;

        function closeMenu() {
            cell.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
        }

        toggle.addEventListener("click", function (event) {
            event.stopPropagation();
            var willOpen = !cell.classList.contains("is-open");
            document.querySelectorAll(".size-filter-cell.is-open").forEach(function (openCell) {
                openCell.classList.remove("is-open");
                var openToggle = openCell.querySelector(".size-filter-toggle");
                if (openToggle) openToggle.setAttribute("aria-expanded", "false");
            });
            cell.classList.toggle("is-open", willOpen);
            toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
        });

        menu.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        applyButton.addEventListener("click", function (event) {
            event.stopPropagation();
            activeSizeFilters = checkboxes.filter(function (checkbox) {
                return checkbox.checked;
            }).map(function (checkbox) {
                return checkbox.value;
            });
            applySizeFilters();
            closeMenu();
        });

        resetButton.addEventListener("click", function (event) {
            event.stopPropagation();
            checkboxes.forEach(function (checkbox) {
                checkbox.checked = false;
            });
            activeSizeFilters = [];
            applySizeFilters();
            closeMenu();
        });
    });

    document.addEventListener("click", function () {
        document.querySelectorAll(".size-filter-cell.is-open").forEach(function (cell) {
            cell.classList.remove("is-open");
            var toggle = cell.querySelector(".size-filter-toggle");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
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
})();
