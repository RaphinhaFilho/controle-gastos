import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import {
  listarTransacoes,
  criarTransacao,
  deletarTransacao,
  logout,
  estaLogado,
} from './api.js';

if (!estaLogado()) {
  window.location.href = 'login.html';
} else {
  Chart.register(DoughnutController, ArcElement, Tooltip, Legend);
  document.body.classList.remove('is-guarded');

  const userEmail = localStorage.getItem('email');
  document.getElementById('user-email').textContent = userEmail || 'Usuário';

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const dateFormatter = new Intl.DateTimeFormat('pt-BR');

  const balanceValue = document.getElementById('balance-value');
  const incomeValue = document.getElementById('income-value');
  const expenseValue = document.getElementById('expense-value');
  const summaryValues = [balanceValue, incomeValue, expenseValue];
  const summarySkeletons = ['balance', 'income', 'expense']
    .map((name) => document.getElementById(`${name}-skeleton`));
  const transactionCount = document.getElementById('transaction-count');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const errorMessage = errorState.querySelector('p');
  const emptyState = document.getElementById('empty-state');
  const tableWrap = document.getElementById('table-wrap');
  const transactionsList = document.getElementById('transactions-list');
  const transactionDialog = document.getElementById('transaction-dialog');
  const transactionForm = document.getElementById('transaction-form');
  const saveError = document.getElementById('save-error');
  const saveButton = transactionForm.querySelector('button[type="submit"]');
  const expensesChartCanvas = document.getElementById('expenses-chart');
  const chartLoading = document.getElementById('chart-loading');
  const chartEmpty = document.getElementById('chart-empty');

  let transactions = [];
  let chartInstance = null;

  function setSummaryLoading(isLoading) {
    summaryValues.forEach((value) => {
      value.hidden = isLoading;
    });
    summarySkeletons.forEach((skeleton) => {
      skeleton.hidden = !isLoading;
    });
  }

  document.getElementById('logout-button').addEventListener('click', logout);

  function openTransactionForm() {
    saveError.hidden = true;
    transactionDialog.showModal();
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    transactionForm.elements.date.value = localDate;
    transactionForm.elements.description.focus();
  }

  document.getElementById('new-transaction-button').addEventListener('click', openTransactionForm);
  document.getElementById('empty-new-button').addEventListener('click', openTransactionForm);
  document.getElementById('close-dialog-button').addEventListener('click', () => transactionDialog.close());
  document.getElementById('cancel-dialog-button').addEventListener('click', () => transactionDialog.close());
  document.getElementById('retry-button').addEventListener('click', loadTransactions);

  function updateSummary() {
    const income = transactions
      .filter((transaction) => transaction.tipo === 'receita')
      .reduce((total, transaction) => total + transaction.valor, 0);
    const expenses = transactions
      .filter((transaction) => transaction.tipo === 'despesa')
      .reduce((total, transaction) => total + transaction.valor, 0);

    balanceValue.textContent = currency.format(income - expenses);
    incomeValue.textContent = currency.format(income);
    expenseValue.textContent = currency.format(expenses);
    transactionCount.textContent = `${transactions.length} ${transactions.length === 1 ? 'registro' : 'registros'}`;
  }

  function updateExpensesChart() {
    const expensesByCategory = transactions
      .filter((transaction) => transaction.tipo === 'despesa')
      .reduce((totals, transaction) => {
        totals.set(transaction.categoria, (totals.get(transaction.categoria) || 0) + transaction.valor);
        return totals;
      }, new Map());
    const categories = [...expensesByCategory.entries()]
      .sort((first, second) => second[1] - first[1]);

    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }

    chartLoading.hidden = true;
    if (categories.length === 0) {
      expensesChartCanvas.hidden = true;
      chartEmpty.hidden = false;
      return;
    }

    chartEmpty.hidden = true;
    expensesChartCanvas.hidden = false;

    const colors = ['#8b5cf6', '#a855f7', '#c4b5fd', '#7c3aed', '#6d28d9'];
    chartInstance = new Chart(expensesChartCanvas, {
      type: 'doughnut',
      data: {
        labels: categories.map(([category]) => category),
        datasets: [{
          data: categories.map(([, total]) => total),
          backgroundColor: categories.map((_, index) => colors[index % colors.length]),
          borderColor: 'rgba(30, 27, 75, 0.9)',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgba(255, 255, 255, 0.78)',
              padding: 18,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${currency.format(context.parsed)}`,
            },
          },
        },
      },
    });
  }

  function formatDate(date) {
    return dateFormatter.format(new Date(`${date}T12:00:00`));
  }

  function createCell(text, className = '') {
    const cell = document.createElement('td');
    cell.textContent = text;
    if (className) cell.className = className;
    return cell;
  }

  function renderTransactions() {
    transactionsList.replaceChildren();
    updateSummary();
    updateExpensesChart();

    const hasTransactions = transactions.length > 0;
    emptyState.hidden = hasTransactions;
    tableWrap.hidden = !hasTransactions;
    if (!hasTransactions) return;

    [...transactions]
      .sort((first, second) => second.data.localeCompare(first.data) || Number(second.id) - Number(first.id))
      .forEach((transaction) => {
        const row = document.createElement('tr');
        const isIncome = transaction.tipo === 'receita';
        row.append(
          createCell(formatDate(transaction.data)),
          createCell(transaction.descricao, 'description-cell'),
          createCell(transaction.categoria),
          createCell(isIncome ? 'Entrada' : 'Saída'),
          createCell(`${isIncome ? '+' : '−'} ${currency.format(transaction.valor)}`, `amount-cell ${isIncome ? 'amount-income' : 'amount-expense'}`),
        );

        const actionCell = document.createElement('td');
        actionCell.className = 'actions-column';
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-button';
        deleteButton.textContent = 'Excluir';
        deleteButton.setAttribute('aria-label', `Excluir transação ${transaction.descricao}`);
        deleteButton.addEventListener('click', () => deleteTransaction(transaction.id));
        actionCell.append(deleteButton);
        row.append(actionCell);
        transactionsList.append(row);
      });
  }

  function showLoadError(message = 'Não foi possível carregar as transações. Tente novamente.') {
    loadingState.hidden = true;
    emptyState.hidden = true;
    tableWrap.hidden = true;
    errorMessage.textContent = message;
    errorState.hidden = false;
  }

  function normalizeTransaction(transaction) {
    if (!transaction || typeof transaction !== 'object') return null;

    const valor = Number(transaction.valor);
    if (!['receita', 'despesa'].includes(transaction.tipo) ||
      typeof transaction.descricao !== 'string' ||
      typeof transaction.data !== 'string' ||
      typeof transaction.categoria !== 'string' ||
      !Number.isFinite(valor) || valor <= 0) {
      return null;
    }

    return {
      id: transaction.id,
      tipo: transaction.tipo,
      descricao: transaction.descricao,
      valor,
      data: transaction.data,
      categoria: transaction.categoria,
    };
  }

  async function loadTransactions() {
    loadingState.hidden = false;
    errorState.hidden = true;
    emptyState.hidden = true;
    tableWrap.hidden = true;
    chartLoading.hidden = false;
    chartEmpty.hidden = true;
    expensesChartCanvas.hidden = true;
    setSummaryLoading(true);

    try {
      const dados = await listarTransacoes();
      if (!Array.isArray(dados)) throw new Error('A resposta da API não está no formato esperado.');

      const normalizedTransactions = dados.map(normalizeTransaction);
      if (normalizedTransactions.some((transaction) => transaction === null)) {
        throw new Error('Não foi possível interpretar as transações recebidas.');
      }

      transactions = normalizedTransactions;
      loadingState.hidden = true;
      renderTransactions();
      setSummaryLoading(false);
    } catch (error) {
      transactions = [];
      updateSummary();
      updateExpensesChart();
      setSummaryLoading(false);
      showLoadError(error.message || 'Não foi possível carregar as transações. Tente novamente.');
    }
  }

  async function deleteTransaction(id) {
    try {
      await deletarTransacao(id);
      await loadTransactions();
    } catch (error) {
      showLoadError(error.message || 'Não foi possível excluir a transação. Tente novamente.');
    }
  }

  transactionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveError.hidden = true;

    const formData = new FormData(transactionForm);
    const valor = Number(formData.get('amount'));
    const dados = {
      descricao: String(formData.get('description') || '').trim(),
      valor,
      tipo: formData.get('type') === 'Entrada' ? 'receita' : 'despesa',
      categoria: formData.get('category'),
      data: formData.get('date'),
    };

    if (!dados.descricao || !Number.isFinite(valor) || valor <= 0 || !dados.categoria || !dados.data) {
      saveError.textContent = 'Preencha os campos corretamente e informe um valor maior que zero.';
      saveError.hidden = false;
      return;
    }

    saveButton.disabled = true;
    try {
      const criada = normalizeTransaction(await criarTransacao(dados));
      if (!criada) throw new Error('A API não retornou a transação criada.');

      transactions = [...transactions, criada];
      transactionForm.reset();
      transactionDialog.close();
      renderTransactions();
    } catch (error) {
      saveError.textContent = error.message || 'Não foi possível salvar a transação. Tente novamente.';
      saveError.hidden = false;
    } finally {
      saveButton.disabled = false;
    }
  });

  loadTransactions();
}
