<?php

declare(strict_types=1);

namespace NeneCorpus\AdminAuth;

use Nene2\Auth\TokenIssuerInterface;

final readonly class LoginAdminUseCase implements LoginAdminUseCaseInterface
{
    private const TOKEN_TTL_SECONDS = 3600;

    /** @see NENE2 password-hashing howto — dummy hash for timing-safe failed login */
    private const DUMMY_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=4,p=1$bEhwVzk4d25rVlFUY0ZaVQ$umHX1oSI/6PmkVI2S35tkDoB6/UL6fXJkTIfqBHe2a0';

    public function __construct(
        private AdminUserRepositoryInterface $adminUsers,
        private ?TokenIssuerInterface $tokenIssuer,
    ) {
    }

    public function execute(LoginAdminInput $input): LoginAdminOutput
    {
        if ($this->tokenIssuer === null) {
            throw new AdminJwtNotConfiguredException('Admin JWT secret is not configured.');
        }

        $user = $this->adminUsers->findByEmail($input->email);
        $hash = $user !== null ? $user->passwordHash : self::DUMMY_PASSWORD_HASH;

        if ($user === null || !password_verify($input->password, $hash)) {
            throw new InvalidAdminCredentialsException('Invalid email or password.');
        }

        $now = time();
        $expiresAt = $now + self::TOKEN_TTL_SECONDS;

        $token = $this->tokenIssuer->issue([
            'sub'    => $user->id,
            'email'  => $user->email,
            'role'   => $user->role,
            'org_id' => $user->organizationId,
            'iat'    => $now,
            'exp'    => $expiresAt,
        ]);

        return new LoginAdminOutput(
            accessToken: $token,
            tokenType: 'Bearer',
            expiresAt: gmdate('c', $expiresAt),
        );
    }
}
