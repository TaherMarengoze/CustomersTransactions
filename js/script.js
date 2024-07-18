
let apiData;
let customersTable;

$(document).ready( function () {

    fetchData();
    
    async function fetchData(){
        let response = await fetch(`/data/data.json`);
        apiData = await response.json();

        customersTable = $('#tblCustomers').DataTable({
            data: apiData.customers,
            columns: [
                {
                    className: 'dt-control text-center',
                    orderable: false,
                    data: null,
                    defaultContent: ''
                },
                {
                    data: 'id',
                    targets: 0,
                    searchable: false,
                    className: 'text-center',
                    render: (data) => data
                },
                {
                    data: 'name',
                    targets: 1,
                    render: (data) => data
                },
                {
                    data: null,
                    targets: 2,
                    render: (data, type, row) => {
                        const customerId = row.id;
    
                        const transactions =
                            apiData.transactions.filter(t => t.customer_id === customerId);
    
                        const sum =
                            transactions.reduce((s, { amount }) => s + amount, 0);
    
                        return sum;
                    }
                }
            ]
        })

        $('#tblCustomers tbody').on('click', 'td.dt-control', function () {
            const tr = $(this).closest('tr');
            const row = customersTable.row(tr);
    
            if (row.child.isShown()) {
                row.child.hide();
            }
            else {
                const custId = row.data().id;
                const transactions = apiData.transactions
                    .filter(t => t.customer_id === custId);
    
                const dayTotalList = Object.values(
                    transactions.reduce((acc, { date, amount }) => {
                        acc[date] = acc[date] || { date, sum: 0 };
                        acc[date].sum += amount;
                        return acc;
                    }, {})
                    );
    
                row.child(format(transactions)).show();
                const canvas = row.child()[0].querySelector('canvas');
                drawChart(canvas,dayTotalList);
            }
        });
    }

    function format(transactions) {
        let transactionsRows = "";
        transactions.forEach(transaction => {
            transactionsRows += `
                <tr>
                    <td>
                        ${transaction.date}
                    </td>
                    <td>
                        ${transaction.amount}
                    </td>
                </tr>
                `;
        })

        return (
            `
            <div class="sub-panel">
                <table class="table table-sm table-info table-striped table-bordered mb-0">
                    <thead>
                        <th>Transaction Date</th>
                        <th>Transaction Amount</th>
                    </thead>

                    <tbody>
                    ${transactionsRows}
                    </tbody>

                </table>

                <div class="chart-area border m-5">
                    <canvas></canvas>
                </div>
            </div>


            `
        );
    }

    function drawChart(canvas, data) {
        const dates = data.map(item => item.date);
        const sums = data.map(item => item.sum);

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Sum of Transactions',
                        data: sums,
                        borderWidth: 1,
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    }
});
