import { UserRepository } from '../repositories/user.repository';
import { CreateUserInput, UpdateUserInput } from '../schemas';

const userRepository = new UserRepository();

export class UserService {
  async findAll() {
    return userRepository.findAll();
  }

  async findById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('NOT_FOUND');
    return user;
  }

  async create(data: CreateUserInput) {
    const existing = await userRepository.findByUsername(data.username);
    if (existing) {
      throw new Error('Username ja existe');
    }
    const emailExists = await userRepository.findByEmail(data.email);
    if (emailExists) {
      throw new Error('Email ja existe');
    }
    return userRepository.create(data);
  }

  async update(id: string, data: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('NOT_FOUND');

    if (data.username) {
      const existing = await userRepository.findByUsername(data.username);
      if (existing && existing.id !== id) {
        throw new Error('Username ja existe');
      }
    }

    if (data.email) {
      const emailExists = await userRepository.findByEmail(data.email);
      if (emailExists && emailExists.id !== id) {
        throw new Error('Email ja existe');
      }
    }

    return userRepository.update(id, data);
  }

  async delete(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('NOT_FOUND');
    return userRepository.delete(id);
  }
}
