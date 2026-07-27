(function () {
    function cellValue(row, index) {
        var text = row.children[index] ? row.children[index].textContent.trim() : "";
        var normalized = text.replace(/,/g, "").replace(/^--$/, "");
        var numeric = parseFloat(normalized);
        if (normalized !== "" && !Number.isNaN(numeric)) return numeric;
        return text.toLowerCase();
    }

    function parseModelSize(row, sizeColumnIndex) {
        var text = row.children[sizeColumnIndex] ? row.children[sizeColumnIndex].textContent.trim() : "";
        if (text === "" || text === "--" || /^n\/?a$/i.test(text)) return null;
        var match = text.replace(/,/g, "").match(/([0-9]+(?:\.[0-9]+)?)/);
        return match ? parseFloat(match[1]) : null;
    }

    function matchesSizeRange(size, range) {
        if (range === "na") return size === null;
        if (size === null) return false;
        if (range === "lt4") return size < 4;
        if (range === "4-10") return size >= 4 && size < 10;
        if (range === "10-20") return size >= 10 && size < 20;
        if (range === "20-40") return size >= 20 && size < 40;
        if (range === "gte40") return size >= 40;
        return false;
    }

    function updateVisibleRanks(table) {
        var visibleRank = 0;
        var medalClasses = ["rank-gold", "rank-silver", "rank-bronze"];

        table.querySelectorAll("tbody tr").forEach(function (row) {
            row.classList.remove("rank-1", "rank-2", "rank-3");
            if (row.hidden || row.style.display === "none") return;

            visibleRank += 1;
            var rankCell = row.cells[0];
            if (!rankCell) return;
            rankCell.textContent = "";

            if (visibleRank <= 3) {
                var rankIcon = document.createElement("span");
                rankIcon.className = "rank-icon " + medalClasses[visibleRank - 1];
                rankIcon.textContent = visibleRank;
                rankCell.appendChild(rankIcon);
                row.classList.add("rank-" + visibleRank);
            } else {
                rankCell.textContent = visibleRank;
            }
        });
    }

    function applyTableFilters(table, filterState) {
        table.querySelectorAll("tbody tr").forEach(function (row) {
            var size = parseModelSize(row, filterState.sizeColumnIndex);
            var isVisible = filterState.activeSizeFilters.length === 0 || filterState.activeSizeFilters.some(function (range) {
                return matchesSizeRange(size, range);
            });
            row.hidden = !isVisible;
            row.style.display = isVisible ? "" : "none";
        });

        var filterCell = table.querySelector(".size-filter-cell");
        if (filterCell) filterCell.classList.toggle("has-active-filter", filterState.activeSizeFilters.length > 0);
        updateVisibleRanks(table);
    }

    function sortTable(table, columnIndex, direction, filterState) {
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
        applyTableFilters(table, filterState);
    }

    function setupFilterCell(options) {
        var cell = options.cell;
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
            options.filterState.activeSizeFilters = checkboxes.filter(function (checkbox) {
                return checkbox.checked;
            }).map(function (checkbox) {
                return checkbox.value;
            });
            applyTableFilters(options.table, options.filterState);
            closeMenu();
        });
        resetButton.addEventListener("click", function (event) {
            event.stopPropagation();
            checkboxes.forEach(function (checkbox) { checkbox.checked = false; });
            options.filterState.activeSizeFilters = [];
            applyTableFilters(options.table, options.filterState);
            closeMenu();
        });
    }

    document.querySelectorAll(".leaderboard-table").forEach(function (table) {
        var sizeFilterCell = table.querySelector(".size-filter-cell");
        var filterState = {
            sizeColumnIndex: sizeFilterCell ? sizeFilterCell.cellIndex : 2,
            activeSizeFilters: []
        };

        table.querySelectorAll("thead th").forEach(function (th, index) {
            th.addEventListener("click", function (event) {
                if (event.target.closest("button, input, label, .size-filter-menu")) return;
                var current = th.dataset.direction === "asc" ? "desc" : "asc";
                table.querySelectorAll("thead th").forEach(function (other) {
                    other.removeAttribute("data-direction");
                    other.classList.remove("active-sort");
                });
                th.dataset.direction = current;
                th.classList.add("active-sort");
                sortTable(table, index, current, filterState);
            });
        });

        setupFilterCell({
            table: table,
            cell: sizeFilterCell,
            toggleSelector: ".size-filter-toggle",
            menuSelector: ".size-filter-menu",
            applySelector: ".size-filter-apply",
            resetSelector: ".size-filter-reset",
            filterState: filterState
        });
        updateVisibleRanks(table);
    });

    document.addEventListener("click", function () {
        document.querySelectorAll(".size-filter-cell.is-open, .group-filter-cell.is-open").forEach(function (cell) {
            cell.classList.remove("is-open");
            var toggle = cell.querySelector("button");
            if (toggle) toggle.setAttribute("aria-expanded", "false");
        });
    });
})();
