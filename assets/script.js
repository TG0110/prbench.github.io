(function () {
    var sizeColumnIndex = 3;
    var groupColumnIndex = 2;
    var activeSizeFilters = [];
    var activeGroupFilters = [];

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
        return match ? parseFloat(match[1]) : null;
    }

    function rowGroup(row) {
        return row.children[groupColumnIndex] ? row.children[groupColumnIndex].textContent.trim().toLowerCase() : "";
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

    function applyTableFilters() {
        document.querySelectorAll(".leaderboard-table tbody tr").forEach(function (row) {
            var size = parseModelSize(row);
            var group = rowGroup(row);
            var sizeVisible = activeSizeFilters.length === 0 || activeSizeFilters.some(function (range) {
                return matchesSizeRange(size, range);
            });
            var groupVisible = activeGroupFilters.length === 0 || activeGroupFilters.indexOf(group) !== -1;
            row.hidden = !(sizeVisible && groupVisible);
        });
        document.querySelectorAll(".size-filter-cell").forEach(function (cell) {
            cell.classList.toggle("has-active-filter", activeSizeFilters.length > 0);
        });
        document.querySelectorAll(".group-filter-cell").forEach(function (cell) {
            cell.classList.toggle("has-active-filter", activeGroupFilters.length > 0);
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
        rows.forEach(function (row) { tbody.appendChild(row); });
        applyTableFilters();
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

    function setupFilterCell(options) {
        var cell = document.querySelector(options.cellSelector);
        if (!cell) return;
        var toggle = cell.querySelector(options.toggleSelector);
        var menu = cell.querySelector(options.menuSelector);
        var applyButton = cell.querySelector(options.applySelector);
        var resetButton = cell.querySelector(options.resetSelector);
        var checkboxes = Array.prototype.slice.call(cell.querySelectorAll('input[type="checkbox"]'));
        if (!toggle || !menu || !applyButton || !resetButton) return;

        function updateMenuPosition() {
            var rect = toggle.getBoundingClientRect();
            var menuWidth = menu.offsetWidth || 150;
            var left = rect.left + rect.width / 2;
            left = Math.max(12 + menuWidth / 2, Math.min(window.innerWidth - 12 - menuWidth / 2, left));
            menu.style.top = Math.round(rect.bottom + 8) + "px";
            menu.style.left = Math.round(left) + "px";
        }

        function closeMenu() {
            cell.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
        }

        toggle.addEventListener("click", function (event) {
            event.stopPropagation();
            var willOpen = !cell.classList.contains("is-open");
            document.querySelectorAll(".size-filter-cell.is-open, .group-filter-cell.is-open").forEach(function (openCell) {
                openCell.classList.remove("is-open");
                var openToggle = openCell.querySelector("button");
                if (openToggle) openToggle.setAttribute("aria-expanded", "false");
            });
            cell.classList.toggle("is-open", willOpen);
            toggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
            if (willOpen) updateMenuPosition();
        });

        window.addEventListener("resize", function () {
            if (cell.classList.contains("is-open")) updateMenuPosition();
        });
        document.addEventListener("scroll", function () {
            if (cell.classList.contains("is-open")) updateMenuPosition();
        }, true);
        menu.addEventListener("click", function (event) { event.stopPropagation(); });
        applyButton.addEventListener("click", function (event) {
            event.stopPropagation();
            options.setActive(checkboxes.filter(function (checkbox) { return checkbox.checked; }).map(function (checkbox) { return checkbox.value; }));
            applyTableFilters();
            closeMenu();
        });
        resetButton.addEventListener("click", function (event) {
            event.stopPropagation();
            checkboxes.forEach(function (checkbox) { checkbox.checked = false; });
            options.setActive([]);
            applyTableFilters();
            closeMenu();
        });
    }

    setupFilterCell({
        cellSelector: ".group-filter-cell",
        toggleSelector: ".group-filter-toggle",
        menuSelector: ".group-filter-menu",
        applySelector: ".group-filter-apply",
        resetSelector: ".group-filter-reset",
        setActive: function (values) { activeGroupFilters = values; }
    });
    setupFilterCell({
        cellSelector: ".size-filter-cell",
        toggleSelector: ".size-filter-toggle",
        menuSelector: ".size-filter-menu",
        applySelector: ".size-filter-apply",
        resetSelector: ".size-filter-reset",
        setActive: function (values) { activeSizeFilters = values; }
    });

    document.addEventListener("click", function () {
        document.querySelectorAll(".size-filter-cell.is-open, .group-filter-cell.is-open").forEach(function (cell) {
            cell.classList.remove("is-open");
            var toggle = cell.querySelector("button");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        });
    });
})();
