// 数据存储
let people = [];
let expenses = [];

// DOM元素
const personNameInput = document.getElementById('personName');
const addPersonButton = document.getElementById('addPerson');
const peopleListDiv = document.getElementById('peopleList');
const payerSelect = document.getElementById('payer');
const amountInput = document.getElementById('amount');
const descriptionInput = document.getElementById('description');
const beneficiariesDiv = document.getElementById('beneficiaries');
const splitMethodSelect = document.getElementById('splitMethod');
const customAmountsDiv = document.getElementById('customAmounts');
const addExpenseButton = document.getElementById('addExpense');
const expensesListDiv = document.getElementById('expensesList');
const debtSummaryDiv = document.getElementById('debtSummary');
const simplifyDebtsButton = document.getElementById('simplifyDebts');
const simplifiedDebtsDiv = document.getElementById('simplifiedDebts');
const graphTypeSelect = document.getElementById('graphType');
const debtGraphDiv = document.getElementById('debtGraph');
const clearDataButton = document.getElementById('clearData');

// 初始化
function init() {
    loadData();
    renderPeopleList();
    renderExpensesList();
    updateDebtSummary();
    updateDebtGraph();

    // 事件监听器
    addPersonButton.addEventListener('click', addPerson);
    splitMethodSelect.addEventListener('change', toggleCustomAmounts);
    addExpenseButton.addEventListener('click', addExpense);
    simplifyDebtsButton.addEventListener('click', simplifyAndRenderDebts);
    graphTypeSelect.addEventListener('change', updateDebtGraph);
    clearDataButton.addEventListener('click', clearAllData);
}

// 从localStorage加载数据
function loadData() {
    const savedPeople = localStorage.getItem('debtCalculator_people');
    const savedExpenses = localStorage.getItem('debtCalculator_expenses');

    if (savedPeople) {
        people = JSON.parse(savedPeople);
    }

    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }
}

// 保存数据到localStorage
function saveData() {
    localStorage.setItem('debtCalculator_people', JSON.stringify(people));
    localStorage.setItem('debtCalculator_expenses', JSON.stringify(expenses));
}

// 添加人员
function addPerson() {
    const name = personNameInput.value.trim();

    if (name === '') {
        alert('请输入姓名');
        return;
    }

    if (people.some(person => person.name === name)) {
        alert('该成员已存在');
        return;
    }

    people.push({ id: Date.now().toString(), name });
    personNameInput.value = '';

    saveData();
    renderPeopleList();
    updatePayerSelect();
    updateBeneficiariesList();
    updateDebtGraph();
}

// 渲染人员列表
function renderPeopleList() {
    peopleListDiv.innerHTML = '';

    if (people.length === 0) {
        peopleListDiv.innerHTML = '<p>暂无成员，请添加</p>';
        return;
    }

    people.forEach(person => {
        const personItem = document.createElement('div');
        personItem.className = 'person-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = person.name;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        deleteButton.className = 'danger';
        deleteButton.addEventListener('click', () => deletePerson(person.id));

        personItem.appendChild(nameSpan);
        personItem.appendChild(deleteButton);
        peopleListDiv.appendChild(personItem);
    });

    updatePayerSelect();
    updateBeneficiariesList();
}

// 删除人员
function deletePerson(id) {
    // 检查该人员是否参与了任何支出
    const isInvolved = expenses.some(expense =>
        expense.payer === id || expense.beneficiaries.some(b => b.id === id)
    );

    if (isInvolved) {
        alert('无法删除该成员，因为他/她已参与了支出记录');
        return;
    }

    people = people.filter(person => person.id !== id);
    saveData();
    renderPeopleList();
    updateDebtGraph();
}

// 更新付款人选择框
function updatePayerSelect() {
    payerSelect.innerHTML = '<option value="">请选择付款人</option>';

    people.forEach(person => {
        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = person.name;
        payerSelect.appendChild(option);
    });
}

// 更新受益人列表
function updateBeneficiariesList() {
    beneficiariesDiv.innerHTML = '';
    customAmountsDiv.innerHTML = '';

    if (people.length === 0) {
        return;
    }

    people.forEach(person => {
        // 受益人复选框
        const beneficiaryItem = document.createElement('div');
        beneficiaryItem.className = 'beneficiary-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `beneficiary-${person.id}`;
        checkbox.value = person.id;
        checkbox.addEventListener('change', updateCustomAmounts);

        const label = document.createElement('label');
        label.htmlFor = `beneficiary-${person.id}`;
        label.textContent = person.name;

        beneficiaryItem.appendChild(checkbox);
        beneficiaryItem.appendChild(label);
        beneficiariesDiv.appendChild(beneficiaryItem);

        // 自定义金额输入框
        const customAmountItem = document.createElement('div');
        customAmountItem.className = 'custom-amount-item';
        customAmountItem.id = `custom-amount-container-${person.id}`;
        customAmountItem.style.display = 'none';

        const customAmountLabel = document.createElement('label');
        customAmountLabel.htmlFor = `custom-amount-${person.id}`;
        customAmountLabel.textContent = `${person.name} 的金额:`;

        const customAmountInput = document.createElement('input');
        customAmountInput.type = 'number';
        customAmountInput.id = `custom-amount-${person.id}`;
        customAmountInput.min = '0';
        customAmountInput.step = '0.01';
        customAmountInput.placeholder = '输入金额';

        customAmountItem.appendChild(customAmountLabel);
        customAmountItem.appendChild(customAmountInput);
        customAmountsDiv.appendChild(customAmountItem);
    });
}

// 切换自定义金额显示
function toggleCustomAmounts() {
    const isCustom = splitMethodSelect.value === 'custom';
    customAmountsDiv.style.display = isCustom ? 'block' : 'none';
    updateCustomAmounts();
}

// 更新自定义金额输入框显示
function updateCustomAmounts() {
    const isCustom = splitMethodSelect.value === 'custom';

    if (!isCustom) {
        return;
    }

    people.forEach(person => {
        const checkbox = document.getElementById(`beneficiary-${person.id}`);
        const customAmountContainer = document.getElementById(`custom-amount-container-${person.id}`);

        if (checkbox && customAmountContainer) {
            customAmountContainer.style.display = checkbox.checked ? 'flex' : 'none';
        }
    });
}

// 添加支出
function addExpense() {
    const payer = payerSelect.value;
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim() || '未命名支出';
    const splitMethod = splitMethodSelect.value;

    // 验证输入
    if (!payer) {
        alert('请选择付款人');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效金额');
        return;
    }

    // 获取受益人
    const beneficiaries = [];
    let totalCustomAmount = 0;

    people.forEach(person => {
        const checkbox = document.getElementById(`beneficiary-${person.id}`);

        if (checkbox && checkbox.checked) {
            if (splitMethod === 'custom') {
                const customAmountInput = document.getElementById(`custom-amount-${person.id}`);
                const customAmount = parseFloat(customAmountInput.value);

                if (isNaN(customAmount) || customAmount < 0) {
                    alert(`请为 ${person.name} 输入有效金额`);
                    return;
                }

                beneficiaries.push({
                    id: person.id,
                    amount: customAmount
                });

                totalCustomAmount += customAmount;
            } else {
                beneficiaries.push({
                    id: person.id,
                    amount: 0 // 将在后面计算
                });
            }
        }
    });

    if (beneficiaries.length === 0) {
        alert('请至少选择一个受益人');
        return;
    }

    if (splitMethod === 'custom' && Math.abs(totalCustomAmount - amount) > 0.01) {
        alert(`自定义金额总和 (${totalCustomAmount.toFixed(2)}) 必须等于总金额 (${amount.toFixed(2)})`);
        return;
    }

    // 如果是平均分配，计算每人金额
    if (splitMethod === 'equal') {
        const perPersonAmount = amount / beneficiaries.length;
        beneficiaries.forEach(beneficiary => {
            beneficiary.amount = perPersonAmount;
        });
    }

    // 创建支出记录
    const expense = {
        id: Date.now().toString(),
        payer,
        amount,
        description,
        date: new Date().toISOString(),
        beneficiaries
    };

    expenses.push(expense);
    saveData();

    // 重置表单
    payerSelect.value = '';
    amountInput.value = '';
    descriptionInput.value = '';
    people.forEach(person => {
        const checkbox = document.getElementById(`beneficiary-${person.id}`);
        if (checkbox) checkbox.checked = false;

        const customAmountInput = document.getElementById(`custom-amount-${person.id}`);
        if (customAmountInput) customAmountInput.value = '';
    });

    splitMethodSelect.value = 'equal';
    customAmountsDiv.style.display = 'none';

    renderExpensesList();
    updateDebtSummary();
    updateDebtGraph();
}

// 渲染支出列表
function renderExpensesList() {
    expensesListDiv.innerHTML = '';

    if (expenses.length === 0) {
        expensesListDiv.innerHTML = '<p>暂无支出记录</p>';
        return;
    }

    expenses.forEach(expense => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';

        const payerName = people.find(p => p.id === expense.payer)?.name || '未知';

        const infoDiv = document.createElement('div');

        const descriptionP = document.createElement('p');
        descriptionP.innerHTML = `<strong>${expense.description}</strong> - ${payerName} 支付了 ¥${expense.amount.toFixed(2)}`;

        const beneficiariesP = document.createElement('p');
        beneficiariesP.className = 'small';

        const beneficiariesText = expense.beneficiaries.map(b => {
            const name = people.find(p => p.id === b.id)?.name || '未知';
            return `${name}: ¥${b.amount.toFixed(2)}`;
        }).join(', ');

        beneficiariesP.textContent = `受益人: ${beneficiariesText}`;

        const dateP = document.createElement('p');
        dateP.className = 'small';
        dateP.textContent = new Date(expense.date).toLocaleString();

        infoDiv.appendChild(descriptionP);
        infoDiv.appendChild(beneficiariesP);
        infoDiv.appendChild(dateP);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '删除';
        deleteButton.className = 'danger';
        deleteButton.addEventListener('click', () => deleteExpense(expense.id));

        expenseItem.appendChild(infoDiv);
        expenseItem.appendChild(deleteButton);
        expensesListDiv.appendChild(expenseItem);
    });
}

// 删除支出
function deleteExpense(id) {
    if (confirm('确定要删除这条支出记录吗？')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveData();
        renderExpensesList();
        updateDebtSummary();
        updateDebtGraph();
    }
}

// 更新债务摘要
function updateDebtSummary() {
    debtSummaryDiv.innerHTML = '';

    if (people.length === 0 || expenses.length === 0) {
        debtSummaryDiv.innerHTML = '<p>暂无债务关系</p>';
        return;
    }

    // 创建一个标题
    const titleDiv = document.createElement('div');
    titleDiv.className = 'summary-title';
    titleDiv.innerHTML = '<strong>每笔支出的详细债务关系：</strong>';
    debtSummaryDiv.appendChild(titleDiv);

    // 显示每笔支出的详细债务关系
    let hasDebts = false;

    expenses.forEach(expense => {
        const payerName = people.find(p => p.id === expense.payer)?.name || '未知';

        // 为每个受益人创建债务项
        expense.beneficiaries.forEach(beneficiary => {
            if (beneficiary.id !== expense.payer && beneficiary.amount > 0) {
                hasDebts = true;
                const beneficiaryName = people.find(p => p.id === beneficiary.id)?.name || '未知';

                const debtItem = document.createElement('div');
                debtItem.className = 'debt-item';

                // 创建左侧信息区
                const infoDiv = document.createElement('div');
                infoDiv.className = 'debt-info';

                // 添加债务关系
                const relationDiv = document.createElement('div');
                relationDiv.textContent = `${beneficiaryName} 需要支付 ${payerName} ¥${beneficiary.amount.toFixed(2)}`;

                // 添加支出描述
                const descriptionDiv = document.createElement('div');
                descriptionDiv.className = 'debt-description';
                descriptionDiv.textContent = `原因: ${expense.description}`;

                infoDiv.appendChild(relationDiv);
                infoDiv.appendChild(descriptionDiv);
                debtItem.appendChild(infoDiv);

                debtSummaryDiv.appendChild(debtItem);
            }
        });
    });

    if (!hasDebts) {
        debtSummaryDiv.innerHTML = '<p>所有人都已结清</p>';
    }
}

// 计算每个人的净余额
function calculateBalances() {
    const balances = {};

    // 初始化余额
    people.forEach(person => {
        balances[person.id] = 0;
    });

    // 计算每个人的净余额
    expenses.forEach(expense => {
        // 付款人增加余额
        balances[expense.payer] += expense.amount;

        // 受益人减少余额
        expense.beneficiaries.forEach(beneficiary => {
            balances[beneficiary.id] -= beneficiary.amount;
        });
    });

    return balances;
}

// 计算债务关系
function calculateDebts(balances) {
    const debts = [];
    const debtors = [];
    const creditors = [];

    // 分离债务人和债权人
    Object.entries(balances).forEach(([id, balance]) => {
        if (Math.abs(balance) < 0.01) return; // 忽略接近零的余额

        if (balance < 0) {
            debtors.push({ id, amount: -balance });
        } else {
            creditors.push({ id, amount: balance });
        }
    });

    // 匹配债务人和债权人
    debtors.forEach(debtor => {
        let remainingDebt = debtor.amount;

        for (let i = 0; i < creditors.length && remainingDebt > 0.01; i++) {
            const creditor = creditors[i];

            if (creditor.amount < 0.01) continue;

            const amount = Math.min(remainingDebt, creditor.amount);

            debts.push({
                from: debtor.id,
                to: creditor.id,
                amount
            });

            remainingDebt -= amount;
            creditor.amount -= amount;
        }
    });

    return debts;
}

// 简化债务关系并渲染
function simplifyAndRenderDebts() {
    simplifiedDebtsDiv.innerHTML = '';

    if (people.length === 0 || expenses.length === 0) {
        simplifiedDebtsDiv.innerHTML = '<p>暂无债务关系可简化</p>';
        return;
    }

    // 计算每个人的净余额
    const balances = calculateBalances();

    // 简化债务关系
    const simplifiedDebts = simplifyDebts(balances);

    if (simplifiedDebts.length === 0) {
        simplifiedDebtsDiv.innerHTML = '<p>所有人都已结清</p>';
        return;
    }

    // 显示简化后的债务关系
    simplifiedDebts.forEach(debt => {
        const debtItem = document.createElement('div');
        debtItem.className = 'debt-item';

        const fromName = people.find(p => p.id === debt.from)?.name || '未知';
        const toName = people.find(p => p.id === debt.to)?.name || '未知';

        debtItem.textContent = `${fromName} 需要支付 ${toName} ¥${debt.amount.toFixed(2)}`;
        simplifiedDebtsDiv.appendChild(debtItem);
    });

    // 更新债务关系图
    updateDebtGraph();
}

// 简化债务关系算法
function simplifyDebts(balances) {
    // 创建正负余额数组
    const negatives = [];
    const positives = [];

    Object.entries(balances).forEach(([id, balance]) => {
        if (Math.abs(balance) < 0.01) return; // 忽略接近零的余额

        if (balance < 0) {
            negatives.push({ id, amount: -balance });
        } else {
            positives.push({ id, amount: balance });
        }
    });

    // 按金额排序
    negatives.sort((a, b) => b.amount - a.amount);
    positives.sort((a, b) => b.amount - a.amount);

    const simplifiedDebts = [];

    // 贪心算法：尽量让最大的债务和最大的债权相互抵消
    while (negatives.length > 0 && positives.length > 0) {
        const debtor = negatives[0];
        const creditor = positives[0];

        const amount = Math.min(debtor.amount, creditor.amount);

        if (amount > 0.01) {
            simplifiedDebts.push({
                from: debtor.id,
                to: creditor.id,
                amount
            });
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        // 移除已结清的人
        if (debtor.amount < 0.01) negatives.shift();
        if (creditor.amount < 0.01) positives.shift();
    }

    return simplifiedDebts;
}

// 清除所有数据
function clearAllData() {
    if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
        people = [];
        expenses = [];
        saveData();
        renderPeopleList();
        renderExpensesList();
        updateDebtSummary();
        simplifiedDebtsDiv.innerHTML = '';
        updateDebtGraph();
    }
}

// 更新债务关系图
function updateDebtGraph() {
    debtGraphDiv.innerHTML = '';

    if (people.length === 0 || expenses.length === 0) {
        debtGraphDiv.innerHTML = '<p>暂无债务关系可显示</p>';
        return;
    }

    // 计算每个人的净余额
    const balances = calculateBalances();

    // 获取债务关系
    const isSimplified = graphTypeSelect.value === 'simplified';
    const debts = isSimplified ? simplifyDebts(balances) : calculateDebts(balances);

    if (debts.length === 0) {
        debtGraphDiv.innerHTML = '<p>所有人都已结清</p>';
        return;
    }

    // 准备图表数据
    const nodes = [];
    const links = [];
    const nodeMap = {};

    // 创建节点
    people.forEach(person => {
        // 只包含有债务关系的人
        const isInvolved = debts.some(debt => debt.from === person.id || debt.to === person.id);
        if (isInvolved) {
            const node = {
                id: person.id,
                name: person.name,
                balance: balances[person.id] || 0
            };
            nodes.push(node);
            nodeMap[person.id] = node;
        }
    });

    // 创建连接
    debts.forEach(debt => {
        links.push({
            source: debt.from,
            target: debt.to,
            value: debt.amount
        });
    });

    // 设置图表尺寸
    const width = debtGraphDiv.clientWidth;
    const height = 400;

    // 创建SVG元素
    const svg = d3.select('#debtGraph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    // 创建力导向图
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2));

    // 绘制连接线
    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke-width', d => Math.sqrt(d.value) * 0.5);

    // 添加债务金额标签
    const linkText = svg.append('g')
        .selectAll('text')
        .data(links)
        .enter()
        .append('text')
        .attr('class', 'debt-amount')
        .text(d => `¥${d.value.toFixed(2)}`);

    // 创建节点组
    const node = svg.append('g')
        .selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    // 添加节点圆圈
    node.append('circle')
        .attr('r', 10)
        .attr('fill', d => d.balance > 0 ? '#2ecc71' : d.balance < 0 ? '#e74c3c' : '#3498db');

    // 添加节点文本标签
    node.append('text')
        .attr('dx', 15)
        .attr('dy', 5)
        .text(d => `${d.name} (${d.balance > 0 ? '+' : ''}${d.balance.toFixed(2)})`)
        .attr('font-weight', d => Math.abs(d.balance) > 0.01 ? 'bold' : 'normal');

    // 更新力导向图
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        linkText
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);

        node
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    // 拖拽函数
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
