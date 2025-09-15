
const form = document.getElementById('form')
const title = document.getElementById("title")
const amount = document.getElementById('amnt')
const category = document.getElementById('category')
const totalCate = document.getElementById('categoryTotals')
const expTable = document.getElementById('expenseTable')
const filterCategory = document.getElementById("filterCategory")
const sortBy = document.getElementById('sortBy')
const chartExp = document.getElementById('expenseChart')

const STORAGE_KEY = "expenses_1"
const readExp = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
const writeExp = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
let expenses = readExp();

const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
const toINR = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

// Submit Form
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const titles = title.value.trim()
    const amnt = parseFloat(amount.value)
    const catgry = category.value.trim()

    if (!titles) {
        title.classList.add("ring-2", "ring-red-500");
        setTimeout(() => title.classList.remove("ring-2", "ring-red-500"), 500);
        return;
    } else if (isNaN(amnt)) {
        amount.classList.add("ring-2", "ring-red-500");
        setTimeout(() => amount.classList.remove("ring-2", "ring-red-500"), 500);
        return;
    } else if (!catgry) {
        category.classList.add("ring-2", "ring-red-500");
        setTimeout(() => category.classList.remove("ring-2", "ring-red-500"), 500);
        return;
    }

    const exp = {
        id: uid(),
        title: titles,
        amount: parseFloat(amnt.toFixed(3)),
        category: catgry,
        date: new Date().toISOString()
    }

    expenses.push(exp)
    writeExp(expenses)
    form.reset()
    renderAll();
})

// Filtering & Sorting
const filterSort = (list) => {
    let prvList = [...list]
    const fc = filterCategory.value
    if (fc)
        prvList = prvList.filter(e => e.category === fc)

    switch (sortBy.value) {
        case "dateAsc": prvList.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
        case "dateDesc": prvList.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
        case "categoryAsc": prvList.sort((a, b) => a.category.localeCompare(b.category)); break;
        case "categoryDesc": prvList.sort((a, b) => b.category.localeCompare(a.category)); break;
        case "amountDesc": prvList.sort((a, b) => b.amount - a.amount); break;
        case "amountAsc": prvList.sort((a, b) => a.amount - b.amount); break;
    }
    return prvList;
}

const escapeHtml = (str) => {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, i =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[i])
    );
}
[filterCategory, sortBy].forEach(e => e.addEventListener("change", renderAll))


// Category Totals
const getCatTotals = (list) => {
    return list.reduce((p, e) => {
        p[e.category] = (p[e.category] || 0) + Number(e.amount || 0)
        return p;
    }, {})
}

// Render Table
const renderTable = () => {
    const list = filterSort(expenses);
    expTable.innerHTML = list.map(e => `
        <tr class="hover:bg-gray-700/30">
          <td class="py-2 pr-4">${escapeHtml(e.title)}</td>
          <td class="py-2 pr-4 text-pink-300 font-semibold">${toINR(e.amount)}</td>
          <td class="py-2 pr-4"><span class="px-2 py-1 rounded bg-blue-600/30 text-blue-300">${e.category}</span></td>
          <td class="py-2 pr-4 text-gray-400">${new Date(e.date).toLocaleString()}</td>
          <td class="py-2 pr-4">
            <button class="text-red-300 hover:text-red-400" delete="${e.id}">Delete</button>
          </td>
        </tr>
      `).join("")   

    expTable.querySelectorAll("[delete]").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("delete");
            expenses = expenses.filter(e => e.id !== id)
            writeExp(expenses)
            renderAll()
        })
    })
}

// Render Totals
const renderTotal = () => {
    const totals = getCatTotals(expenses)
    const entries = Object.entries(totals);
    totalCate.innerHTML = entries.length
        ? entries.map(([cat, amt]) => `
          <span class="inline-flex items-center gap-2 bg-gray-700/60 rounded-full px-3 py-1">
            <span class="text-blue-300">${cat}</span>
            <span class="text-pink-300 font-semibold">${toINR(amt)}</span>
          </span>
        `).join("")
        : `<span class="text-gray-400">No totals yet</span>`
}

// Render Chart
let chart;
const renderChart = () => {
    const totals = getCatTotals(expenses)
    const labels = Object.keys(totals)
    const data = Object.values(totals)

    const colors = ["#ec4899", "#60a5fa", "#880E4F", "#0D47A1", "#9C27B0", "#0097A7"]

    const ds = {
        labels,
        datasets: [{
            data,
            backgroundColor: labels.map((_, i) => colors[i % colors.length]),
            borderColor: "rgba(0,0,0,0)"
        }]
    };

    if (chart) {
        chart.data = ds;
        chart.update()
    } else {
        chart = new Chart(chartExp, {
            type: "pie",
            data: ds,
            options: {
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "#e5e7eb" }
                    },
                    title: { display: false }
                }
            }
        })
    }
}


const renderAll = () => {
    renderTable();
    renderTotal();
    renderChart();
}

renderAll();