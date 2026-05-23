import { UserRepository } from '../repositories/user.repository';
import { comparePassword } from '../libs/bcrypt';
import { signToken } from '../libs/jwt';
import { LoginInput } from '../schemas';

const userRepository = new UserRepository();

export class AuthService {
  async login(data: LoginInput) {
    const user = await userRepository.findByUsernameWithPassword(data.username);

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    if (!user.active) {
      throw new Error('Usuário inativo');
    }

    const passwordValid = await comparePassword(data.password, user.password);
    if (!passwordValid) {
      throw new Error('Credenciais inválidas');
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
