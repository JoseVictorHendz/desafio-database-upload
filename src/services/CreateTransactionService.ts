import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionRepository from '../repositories/TransactionsRepository';
import CategoryRepository from '../repositories/CategoryRepository';

import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getCustomRepository(CategoryRepository);

    if (type === 'outcome') {
      const negativeBalance = transactionRepository.getBalance();
      if ((await negativeBalance).total - value < 0)
        throw new AppError('insufficient funds');
    }

    let existCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!existCategory) {
      existCategory = await categoryRepository.create({ title: category });

      await categoryRepository.save(existCategory);
    }
    const createTransaction = await transactionRepository.create({
      title,
      value,
      type,
      category_id: existCategory.id,
    });

    await transactionRepository.save(createTransaction);
    return createTransaction;
  }
}

export default CreateTransactionService;
