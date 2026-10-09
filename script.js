
"use strict";

// Storage key used by this application
const STORAGE_KEY = "myNewProject.customers.v1";

// Find HTML elements
const $ = (id) => document.getElementById(id);

const elements = {
    addButton: $("addCustomerBtn"),
    emptyAddButton: $("emptyAddBtn"),
    modal: $("customerModal"),
    modalTitle: $("modalTitle"),
    closeModal: $("closeModalBtn"),
    cancelModal: $("cancelModalBtn"),
    form: $("customerForm"),
    id: $("customerId"),
    name: $("customerName"),
    email: $("customerEmail"),
    company: $("customerCompany"),
    phone: $("customerPhone"),
    status: $("customerStatus"),
    formError: $("formError"),
    saveButton: $("saveCustomerBtn"),
    search: $("searchInput"),
    statusFilter: $("statusFilter"),
    tableBody: $("customerTableBody"),
    emptyState: $("emptyState"),
    tableSummary: $("tableSummary"),
    total: $("totalCustomers"),
    active: $("activeCustomers"),
    inactive: $("inactiveCustomers"),
    newCustomers: $("newCustomers"),
    exportButton: $("exportBtn"),
    toast: $("toast"),
    mobileMenu: $("mobileMenu"),
    sidebar: $("sidebar")
};

let customers = loadCustomers();
let toastTimer;

// Generate a unique ID for each customer
function makeId() {
    return window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Load saved records from localStorage
function loadCustomers() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];

        const data = JSON.parse(saved);

        if (!Array.isArray(data)) return [];

        return data.filter((customer) =>
            customer &&
            typeof customer.id === "string" &&
            typeof customer.name === "string" &&
            typeof customer.email === "string" &&
            typeof customer.company === "string" &&
            typeof customer.phone === "string" &&
            ["Active", "Inactive"].includes(customer.status)
        );
    } catch (error) {
        console.error("Could not load customer records:", error);
        return [];
    }
}

// Save records to localStorage
function saveCustomers() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
        return true;
    } catch (error) {
        console.error("Could not save customer records:", error);
        showToast("Unable to save. Check your browser storage.");
        return false;
    }
}

// Escape text before adding it to HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Show a notification
function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        elements.toast.classList.remove("show");
    }, 2800);
}

// Format date for display
function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

// Get customers matching the search and status filter
function getFilteredCustomers() {
    const query = elements.search.value.trim().toLowerCase();
    const selectedStatus = elements.statusFilter.value;

    return customers.filter((customer) => {
        const matchesSearch = [
            customer.name,
            customer.email,
            customer.company,
            customer.phone
        ].some((value) => value.toLowerCase().includes(query));

        const matchesStatus =
            selectedStatus === "all" ||
            customer.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });
}

// Create initials for the customer avatar
function getInitials(name) {
    return name.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

// Display customer rows
function renderCustomers() {
    const filteredCustomers = getFilteredCustomers();

    elements.tableBody.innerHTML = filteredCustomers.map((customer) => {
        const name = escapeHTML(customer.name);
        const email = escapeHTML(customer.email);
        const company = escapeHTML(customer.company);
        const phone = escapeHTML(customer.phone);
        const status = escapeHTML(customer.status);
        const initials = escapeHTML(getInitials(customer.name));
        const date = escapeHTML(formatDate(customer.createdAt));
        const id = escapeHTML(customer.id);

        const statusClass = customer.status === "Active"
            ? "status-active"
            : "status-inactive";

        return `
            <tr>
                <td>
                    <div class="customer-cell">
                        <div class="customer-avatar purple">
                            ${initials}
                        </div>
                        <div>
                            <div class="customer-name">${name}</div>
                            <div class="customer-email">${email}</div>
                        </div>
                    </div>
                </td>

                <td>${company}</td>
                <td>${phone}</td>

                <td>
                    <span class="status ${statusClass}">
                        ${status}
                    </span>
                </td>

                <td>${date}</td>

                <td>
                    <div class="action-buttons">
                        <button class="action-btn"
                            data-action="edit"
                            data-id="${id}">
                            Edit
                        </button>

                        <button class="action-btn delete"
                            data-action="delete"
                            data-id="${id}">
                            Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    elements.emptyState.hidden = filteredCustomers.length > 0;
    elements.tableSummary.textContent =
        `Showing ${filteredCustomers.length} of ${customers.length} customers`;

    // Update dashboard statistics
    elements.total.textContent = customers.length;

    elements.active.textContent = customers.filter(
        (customer) => customer.status === "Active"
    ).length;

    elements.inactive.textContent = customers.filter(
        (customer) => customer.status === "Inactive"
    ).length;

    const now = new Date();

    elements.newCustomers.textContent = customers.filter((customer) => {
        const date = new Date(customer.createdAt);

        return !Number.isNaN(date.getTime()) &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();
    }).length;
}

// Open the add/edit modal
function openModal(customer = null) {
    elements.form.reset();
    elements.formError.textContent = "";
    elements.id.value = "";

    if (customer) {
        elements.modalTitle.textContent = "Edit Customer";
        elements.saveButton.textContent = "Update Customer";

        elements.id.value = customer.id;
        elements.name.value = customer.name;
        elements.email.value = customer.email;
        elements.company.value = customer.company;
        elements.phone.value = customer.phone;
        elements.status.value = customer.status;
    } else {
        elements.modalTitle.textContent = "Add Customer";
        elements.saveButton.textContent = "Save Customer";
        elements.status.value = "Active";
    }

    elements.modal.hidden = false;
    elements.name.focus();
}

// Close the modal
function closeModal() {
    elements.modal.hidden = true;
    elements.formError.textContent = "";
}

// Add a new customer or update an existing one
function handleFormSubmit(event) {
    event.preventDefault();

    const id = elements.id.value;

    const name = elements.name.value.trim();
    const email = elements.email.value.trim();
    const company = elements.company.value.trim();
    const phone = elements.phone.value.trim();
    const status = elements.status.value;

    elements.formError.textContent = "";

    if (!name || !email || !company || !phone) {
        elements.formError.textContent =
            "Please fill in all required fields.";
        return;
    }

    if (!elements.email.validity.valid) {
        elements.formError.textContent =
            "Please enter a valid email address.";
        elements.email.focus();
        return;
    }

    if (!["Active", "Inactive"].includes(status)) {
        elements.formError.textContent = "Please select a valid status.";
        return;
    }

    // Prevent duplicate email addresses
    const duplicateEmail = customers.some((customer) =>
        customer.email.toLowerCase() === email.toLowerCase() &&
        customer.id !== id
    );

    if (duplicateEmail) {
        elements.formError.textContent =
            "This email address already exists.";
        elements.email.focus();
        return;
    }

    const existingCustomer = customers.find(
        (customer) => customer.id === id
    );

    const customer = {
        id: existingCustomer ? existingCustomer.id : makeId(),
        name,
        email,
        company,
        phone,
        status,
        createdAt: existingCustomer
            ? existingCustomer.createdAt
            : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const previousCustomers = customers;

    if (existingCustomer) {
        customers = customers.map((item) =>
            item.id === id ? customer : item
        );
    } else {
        customers = [customer, ...customers];
    }

    // Only close the modal after the save succeeds
    if (!saveCustomers()) {
        customers = previousCustomers;
        return;
    }

    closeModal();
    renderCustomers();

    showToast(existingCustomer
        ? "Customer updated successfully!"
        : "Customer added successfully!");
}

// Edit a customer
function editCustomer(id) {
    const customer = customers.find((item) => item.id === id);

    if (customer) {
        openModal(customer);
    }
}

// Delete a customer
function deleteCustomer(id) {
    const customer = customers.find((item) => item.id === id);

    if (!customer) return;

    const confirmed = window.confirm(
        `Are you sure you want to delete ${customer.name}?`
    );

    if (!confirmed) return;

    const previousCustomers = customers;

    customers = customers.filter((item) => item.id !== id);

    if (!saveCustomers()) {
        customers = previousCustomers;
        return;
    }

    renderCustomers();
    showToast("Customer deleted successfully!");
}

// Export currently filtered records as a CSV file
function exportCSV() {
    const records = getFilteredCustomers();

    if (records.length === 0) {
        showToast("No customer records to export.");
        return;
    }

    const headers = [
        "Name", "Email", "Company",
        "Phone", "Status", "Date Added"
    ];

    const csvCell = (value) => {
        let text = String(value ?? "");

        // Reduce the risk of spreadsheet formula execution
        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = records.map((customer) => [
        customer.name,
        customer.email,
        customer.company,
        customer.phone,
        customer.status,
        formatDate(customer.createdAt)
    ]);

    const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "my-new-project-customers.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    showToast("Customer CSV exported successfully!");
}

// Event listeners
elements.addButton.addEventListener("click", () => openModal());

elements.emptyAddButton.addEventListener("click", () => openModal());

elements.closeModal.addEventListener("click", closeModal);

elements.cancelModal.addEventListener("click", closeModal);

elements.form.addEventListener("submit", handleFormSubmit);

elements.search.addEventListener("input", renderCustomers);

elements.statusFilter.addEventListener("change", renderCustomers);

elements.exportButton.addEventListener("click", exportCSV);

// Handle Edit and Delete buttons in the table
elements.tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "edit") editCustomer(id);
    if (action === "delete") deleteCustomer(id);
});

// Close the modal when clicking outside it
elements.modal.addEventListener("click", (event) => {
    if (event.target === elements.modal) {
        closeModal();
    }
});

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.modal.hidden) {
        closeModal();
    }

    if ((event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k") {
        event.preventDefault();
        elements.search.focus();
    }
});

// Mobile sidebar
elements.mobileMenu.addEventListener("click", () => {
    elements.sidebar.classList.toggle("open");
});

// Close mobile sidebar when a navigation link is selected
document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach((item) => {
            item.classList.remove("active");
        });

        link.classList.add("active");
        elements.sidebar.classList.remove("open");
    });
});

// Set the current year and show the initial dashboard
$("currentYear").textContent = new Date().getFullYear();

renderCustomers();