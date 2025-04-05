// 数据存储
let people = [];
let expenses = [];
let settledDebts = []; // 已结清的债务

// DOM元素
let personNameInput;
let addPersonButton;
let peopleListDiv;
let payersDiv;
let payerAmountsContainer;
let payerAmountsDiv;
let amountInput;
let descriptionInput;
let beneficiariesDiv;
let splitMethodSelect;
let customAmountsDiv;
let addExpenseButton;
let expensesListDiv;
let debtSummaryDiv;
let simplifyDebtsButton;
let simplifiedDebtsDiv;

let clearDataButton;
let tabButtons;
let tabPanes;

// 初始化DOM元素
function initDOMElements() {
    personNameInput = document.getElementById('personName');
    addPersonButton = document.getElementById('addPerson');
    peopleListDiv = document.getElementById('peopleList');
    payersDiv = document.getElementById('payers');
    payerAmountsContainer = document.getElementById('payerAmountsContainer');
    payerAmountsDiv = document.getElementById('payerAmounts');
    amountInput = document.getElementById('amount');
    descriptionInput = document.getElementById('description');
    beneficiariesDiv = document.getElementById('beneficiaries');
    splitMethodSelect = document.getElementById('splitMethod');
    customAmountsDiv = document.getElementById('customAmounts');
    addExpenseButton = document.getElementById('addExpense');
    expensesListDiv = document.getElementById('expensesList');
    debtSummaryDiv = document.getElementById('debtSummary');
    simplifyDebtsButton = document.getElementById('simplifyDebts');
    simplifiedDebtsDiv = document.getElementById('simplifiedDebts');

    clearDataButton = document.getElementById('clearData');
    tabButtons = document.querySelectorAll('.tab-btn');
    tabPanes = document.querySelectorAll('.tab-pane');
}

// 初始化
function init() {
    // 初始化DOM元素
    initDOMElements();

    loadData();
    renderPeopleList();
    renderExpensesList();
    updateDebtSummary();

    // 事件监听器
    addPersonButton.addEventListener('click', addPerson);
    splitMethodSelect.addEventListener('change', toggleCustomAmounts);
    addExpenseButton.addEventListener('click', addExpense);
    simplifyDebtsButton.addEventListener('click', simplifyAndRenderDebts);

    clearDataButton.addEventListener('click', clearAllData);

    // 标签页切换事件
    document.querySelectorAll('.tab-btn').forEach(button => {
        // 移除可能存在的旧事件监听器
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // 添加新的事件监听器
        newButton.addEventListener('click', function(event) {
            event.preventDefault(); // 防止默认行为
            const tabId = this.getAttribute('data-tab');
            console.log('Tab button clicked:', tabId);
            if (tabId) {
                switchTab(tabId);
            }
        });
    });
}

// 从localStorage加载数据
function loadData() {
    const savedPeople = localStorage.getItem('debtCalculator_people');
    const savedExpenses = localStorage.getItem('debtCalculator_expenses');
    const savedSettledDebts = localStorage.getItem('debtCalculator_settledDebts');

    if (savedPeople) {
        people = JSON.parse(savedPeople);
    }

    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }

    if (savedSettledDebts) {
        settledDebts = JSON.parse(savedSettledDebts);
    }
}

// 保存数据到localStorage
function saveData() {
    localStorage.setItem('debtCalculator_people', JSON.stringify(people));
    localStorage.setItem('debtCalculator_expenses', JSON.stringify(expenses));
    localStorage.setItem('debtCalculator_settledDebts', JSON.stringify(settledDebts));
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
    payersDiv.innerHTML = '';
    payerAmountsDiv.innerHTML = '';

    if (people.length === 0) {
        payersDiv.innerHTML = '<p>暂无成员，请先添加成员</p>';
        return;
    }

    people.forEach(person => {
        // 付款人复选框
        const payerItem = document.createElement('div');
        payerItem.className = 'payer-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `payer-${person.id}`;
        checkbox.value = person.id;
        checkbox.addEventListener('change', updatePayerAmounts);

        const label = document.createElement('label');
        label.htmlFor = `payer-${person.id}`;
        label.textContent = person.name;

        payerItem.appendChild(checkbox);
        payerItem.appendChild(label);
        payersDiv.appendChild(payerItem);

        // 付款人金额输入框
        const payerAmountItem = document.createElement('div');
        payerAmountItem.className = 'payer-amount-item';
        payerAmountItem.id = `payer-amount-container-${person.id}`;
        payerAmountItem.style.display = 'none';

        const payerAmountLabel = document.createElement('label');
        payerAmountLabel.htmlFor = `payer-amount-${person.id}`;
        payerAmountLabel.textContent = `${person.name} 的付款金额:`;

        const payerAmountInput = document.createElement('input');
        payerAmountInput.type = 'number';
        payerAmountInput.id = `payer-amount-${person.id}`;
        payerAmountInput.min = '0';
        payerAmountInput.step = '0.01';
        payerAmountInput.placeholder = '输入金额';
        payerAmountInput.addEventListener('input', updateTotalAmount);

        payerAmountItem.appendChild(payerAmountLabel);
        payerAmountItem.appendChild(payerAmountInput);
        payerAmountsDiv.appendChild(payerAmountItem);
    });
}

// 更新付款人金额输入框显示
function updatePayerAmounts() {
    let hasSelectedPayers = false;

    people.forEach(person => {
        const checkbox = document.getElementById(`payer-${person.id}`);
        const payerAmountContainer = document.getElementById(`payer-amount-container-${person.id}`);

        if (checkbox && payerAmountContainer) {
            const isChecked = checkbox.checked;
            payerAmountContainer.style.display = isChecked ? 'flex' : 'none';

            if (isChecked) {
                hasSelectedPayers = true;
            }
        }
    });

    payerAmountsContainer.style.display = hasSelectedPayers ? 'flex' : 'none';
    updateTotalAmount();
}

// 更新总金额
function updateTotalAmount() {
    let total = 0;

    people.forEach(person => {
        const checkbox = document.getElementById(`payer-${person.id}`);

        if (checkbox && checkbox.checked) {
            const amountInput = document.getElementById(`payer-amount-${person.id}`);
            const amount = parseFloat(amountInput.value) || 0;
            total += amount;
        }
    });

    amountInput.value = total.toFixed(2);
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
    console.log('Adding expense...');
    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value.trim() || '未命名支出';
    const splitMethod = splitMethodSelect.value;

    // 获取付款人及其付款金额
    const payers = [];
    let totalPayerAmount = 0;
    let hasInvalidAmount = false;

    people.forEach(person => {
        const checkbox = document.getElementById(`payer-${person.id}`);

        if (checkbox && checkbox.checked) {
            const payerAmountInput = document.getElementById(`payer-amount-${person.id}`);
            const payerAmount = parseFloat(payerAmountInput.value) || 0;

            if (payerAmount <= 0) {
                alert(`请为 ${person.name} 输入有效的付款金额`);
                hasInvalidAmount = true;
                return; // 只从当前循环返回
            }

            payers.push({
                id: person.id,
                amount: payerAmount
            });

            totalPayerAmount += payerAmount;
        }
    });

    // 如果有无效金额，停止处理
    if (hasInvalidAmount) {
        return;
    }

    // 验证输入
    if (payers.length === 0) {
        alert('请选择至少一个付款人');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效金额');
        return;
    }

    if (Math.abs(totalPayerAmount - amount) > 0.01) {
        alert(`付款人金额总和 (${totalPayerAmount.toFixed(2)}) 必须等于总金额 (${amount.toFixed(2)})`);
        return;
    }

    console.log('Validation passed, proceeding to get beneficiaries...');

    // 获取受益人
    const beneficiaries = [];
    let totalCustomAmount = 0;
    let hasInvalidBeneficiary = false;

    people.forEach(person => {
        const checkbox = document.getElementById(`beneficiary-${person.id}`);

        if (checkbox && checkbox.checked) {
            if (splitMethod === 'custom') {
                const customAmountInput = document.getElementById(`custom-amount-${person.id}`);
                const customAmount = parseFloat(customAmountInput.value);

                if (isNaN(customAmount) || customAmount < 0) {
                    alert(`请为 ${person.name} 输入有效金额`);
                    hasInvalidBeneficiary = true;
                    return; // 只从当前循环返回
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

    // 如果有无效的受益人金额，停止处理
    if (hasInvalidBeneficiary) {
        return;
    }

    if (beneficiaries.length === 0) {
        alert('请至少选择一个受益人');
        return;
    }

    if (splitMethod === 'custom' && Math.abs(totalCustomAmount - amount) > 0.01) {
        alert(`自定义金额总和 (${totalCustomAmount.toFixed(2)}) 必须等于总金额 (${amount.toFixed(2)})`);
        return;
    }

    console.log('All validations passed, creating expense record...');

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
        payers,
        amount,
        description,
        date: new Date().toISOString(),
        beneficiaries
    };

    expenses.push(expense);
    saveData();

    // 重置表单
    amountInput.value = '';
    descriptionInput.value = '';
    people.forEach(person => {
        // 重置付款人
        const payerCheckbox = document.getElementById(`payer-${person.id}`);
        if (payerCheckbox) payerCheckbox.checked = false;

        const payerAmountInput = document.getElementById(`payer-amount-${person.id}`);
        if (payerAmountInput) payerAmountInput.value = '';

        // 重置受益人
        const beneficiaryCheckbox = document.getElementById(`beneficiary-${person.id}`);
        if (beneficiaryCheckbox) beneficiaryCheckbox.checked = false;

        const customAmountInput = document.getElementById(`custom-amount-${person.id}`);
        if (customAmountInput) customAmountInput.value = '';
    });

    // 隐藏付款人金额输入框
    payerAmountsContainer.style.display = 'none';

    splitMethodSelect.value = 'equal';
    customAmountsDiv.style.display = 'none';

    renderExpensesList();
    updateDebtSummary();
    updateDebtGraph();

    // 添加支出后切换到支出记录标签页
    switchTab('records');
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

        // 获取付款人信息
        const payersText = expense.payers.map(p => {
            const name = people.find(person => person.id === p.id)?.name || '未知';
            return `${name}: ¥${p.amount.toFixed(2)}`;
        }).join(', ');

        const infoDiv = document.createElement('div');

        const descriptionP = document.createElement('p');
        descriptionP.innerHTML = `<strong>${expense.description}</strong> - 总金额: ¥${expense.amount.toFixed(2)}`;

        const payersP = document.createElement('p');
        payersP.className = 'small';
        payersP.textContent = `付款人: ${payersText}`;

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
        infoDiv.appendChild(payersP);
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
        // 为每个付款人和受益人创建债务项
        expense.payers.forEach(payer => {
            const payerName = people.find(p => p.id === payer.id)?.name || '未知';

            expense.beneficiaries.forEach(beneficiary => {
                // 计算该受益人应支付给该付款人的金额
                // 按比例分配：该付款人的付款比例 * 该受益人的受益金额
                const payerRatio = payer.amount / expense.amount;
                const debtAmount = beneficiary.amount * payerRatio;

                // 检查该债务是否已结清
                const isSettled = isDebtSettled(expense.id, payer.id, beneficiary.id);

                if (beneficiary.id !== payer.id && debtAmount > 0.01 && !isSettled) {
                    hasDebts = true;
                    const beneficiaryName = people.find(p => p.id === beneficiary.id)?.name || '未知';

                    const debtItem = document.createElement('div');
                    debtItem.className = 'debt-item';

                    // 创建左侧信息区
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'debt-info';

                    // 添加债务关系
                    const relationDiv = document.createElement('div');
                    relationDiv.textContent = `${beneficiaryName} 需要支付 ${payerName} ¥${debtAmount.toFixed(2)}`;

                    // 添加支出描述
                    const descriptionDiv = document.createElement('div');
                    descriptionDiv.className = 'debt-description';
                    descriptionDiv.textContent = `原因: ${expense.description}`;

                    infoDiv.appendChild(relationDiv);
                    infoDiv.appendChild(descriptionDiv);
                    debtItem.appendChild(infoDiv);

                    // 添加操作按钮区
                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'debt-actions';

                    // 标记为已结清按钮
                    const settleButton = document.createElement('button');
                    settleButton.className = 'settle-btn';
                    settleButton.textContent = '标记为已结清';
                    settleButton.addEventListener('click', () => markDebtAsSettled(expense.id, payer.id, beneficiary.id));

                    // 删除按钮
                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'danger small';
                    deleteButton.textContent = '删除';
                    deleteButton.addEventListener('click', () => deleteExpense(expense.id));

                    actionsDiv.appendChild(settleButton);
                    actionsDiv.appendChild(deleteButton);
                    debtItem.appendChild(actionsDiv);

                    debtSummaryDiv.appendChild(debtItem);
                }
            });
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
        expense.payers.forEach(payer => {
            balances[payer.id] += payer.amount;
        });

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
        settledDebts = [];
        saveData();
        renderPeopleList();
        renderExpensesList();
        updateDebtSummary();
        simplifiedDebtsDiv.innerHTML = '';
    }
}

// 标记债务为已结清
function markDebtAsSettled(expenseId, payerId, beneficiaryId) {
    // 创建一个已结清的债务记录
    const settledDebt = {
        expenseId,
        payerId,
        beneficiaryId,
        settledDate: new Date().toISOString()
    };

    // 添加到已结清债务列表
    settledDebts.push(settledDebt);
    saveData();

    // 更新债务摘要显示
    updateDebtSummary();

    alert('该债务已标记为已结清');
}

// 检查债务是否已结清
function isDebtSettled(expenseId, payerId, beneficiaryId) {
    return settledDebts.some(debt =>
        debt.expenseId === expenseId &&
        debt.payerId === payerId &&
        debt.beneficiaryId === beneficiaryId
    );
}

// 切换标签页
function switchTab(tabId) {
    console.log('Switching to tab:', tabId); // 调试日志

    // 防止空值
    if (!tabId) {
        console.error('Tab ID is empty');
        return;
    }

    // 重新获取所有标签页元素，确保我们有最新的引用
    const allTabButtons = document.querySelectorAll('.tab-btn');
    const allTabPanes = document.querySelectorAll('.tab-pane');

    // 移除所有标签页按钮的活动状态
    allTabButtons.forEach(btn => {
        btn.classList.remove('active');
        console.log('Removed active from button:', btn.getAttribute('data-tab'));
    });

    // 添加当前标签页按钮的活动状态
    const activeButton = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        console.log('Added active to button:', tabId);
    } else {
        console.error('Active button not found for tab:', tabId);
    }

    // 隐藏所有标签页内容
    allTabPanes.forEach(pane => {
        pane.classList.remove('active');
        console.log('Removed active from pane:', pane.id);
    });

    // 显示当前标签页内容
    const activePane = document.getElementById(`${tabId}-tab`);
    if (activePane) {
        activePane.classList.add('active');
        console.log('Added active to pane:', activePane.id);
    } else {
        console.error('Active pane not found for tab:', tabId);
    }


}





// 直接切换标签页的函数（供 HTML 中的 onclick 事件调用）
function switchTabDirect(tabId) {
    console.log('Direct tab switch to:', tabId);

    // 防止空值
    if (!tabId) return;

    // 移除所有标签页按钮的活动状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 添加当前标签页按钮的活动状态
    const activeButton = document.querySelector(`.tab-btn[onclick*="'${tabId}'"`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // 隐藏所有标签页内容
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // 显示当前标签页内容
    const activePane = document.getElementById(`${tabId}-tab`);
    if (activePane) {
        activePane.classList.add('active');
    }


}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
