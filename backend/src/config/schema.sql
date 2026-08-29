CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS psicologos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(255) NOT NULL,
    crp VARCHAR(20) UNIQUE NOT NULL,
    especialidade VARCHAR(100),
    telefone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'psicologo',
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    psicologo_id UUID REFERENCES psicologos(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE,
    genero VARCHAR(20),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    ocupacao VARCHAR(100),
    estado_civil VARCHAR(50),
    convenio VARCHAR(100),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prontuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    psicologo_id UUID REFERENCES psicologos(id),
    naturalidade VARCHAR(100),
    nacionalidade VARCHAR(100),
    religiao VARCHAR(100),
    escolaridade VARCHAR(100),
    profissao VARCHAR(100),
    estado_civil VARCHAR(50),
    queixa_principal TEXT,
    historia_doenca_atual TEXT,
    historico_familiar TEXT,
    historico_pessoal TEXT,
    historico_medico TEXT,
    medicamentos_atuais TEXT,
    alergias TEXT,
    cirurgias TEXT,
    comportamento_observado TEXT,
    afeto_humor TEXT,
    pensamento_percepcao TEXT,
    cognicao_memoria TEXT,
    juizo_critico TEXT,
    impressao_diagnostica TEXT,
    hipoteses_diagnosticas TEXT,
    cid_codigo VARCHAR(10),
    objetivos_terapeuticos TEXT,
    conduta_terapeutica TEXT,
    frequencia_atendimento VARCHAR(50),
    proxima_consulta DATE,
    motivo_busca TEXT,
    data_encerramento DATE,
    motivo_encerramento TEXT,
    encaminhamento_para TEXT,
    observacoes_encerramento TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    psicologo_id UUID REFERENCES psicologos(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    duracao INTEGER DEFAULT 50,
    tipo_consulta VARCHAR(50) DEFAULT 'presencial',
    status VARCHAR(20) DEFAULT 'agendado',
    valor_consulta DECIMAL(10,2) DEFAULT 0,
    compareceu BOOLEAN DEFAULT NULL,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(psicologo_id, data, horario)
);

CREATE TABLE IF NOT EXISTS evolucoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    psicologo_id UUID REFERENCES psicologos(id),
    data DATE DEFAULT CURRENT_DATE,
    conteudo TEXT NOT NULL,
    procedimentos TEXT,
    progresso TEXT,
    sigiloso BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_psicologo_data ON agendamentos(psicologo_id, data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_psicologo ON pacientes(psicologo_id);
CREATE INDEX IF NOT EXISTS idx_evolucoes_paciente ON evolucoes(paciente_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pacientes_updated_at ON pacientes;
CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prontuarios_updated_at ON prontuarios;
CREATE TRIGGER update_prontuarios_updated_at BEFORE UPDATE ON prontuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agendamentos_updated_at ON agendamentos;
CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO psicologos (email, senha_hash, nome_completo, crp, role) 
VALUES ('admin@expandir.com', '$2b$10$YQxV7hYz5ZZ4TZiGm3v12eXx6ZyRhU9ygVqMgVW9pKgD5hQwV7w6O', 'Administrador', '00/00000', 'admin')
ON CONFLICT (email) DO NOTHING;