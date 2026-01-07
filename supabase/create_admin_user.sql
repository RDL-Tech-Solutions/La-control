-- =============================================
-- LA CONTROL - Criar Usuário Admin (Versão Robusta)
-- =============================================
-- Execute este SQL no SQL Editor do Supabase
-- =============================================

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- 1. Verificar se o usuário já existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@admin.com') THEN
    
    -- 2. Inserir na tabela auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'admin@admin.com',
        crypt('admin123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Administrador"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- 3. Inserir na tabela auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        format('{"sub":"%s","email":"%s"}', new_user_id, 'admin@admin.com')::jsonb,
        'email',
        new_user_id::text,
        NOW(),
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Usuário admin@admin.com criado com sucesso!';
  ELSE
    RAISE NOTICE 'Usuário admin@admin.com já existe.';
  END IF;
END $$;
