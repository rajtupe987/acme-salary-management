import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1792425762230 implements MigrationInterface {
    name = 'InitialSchema1792425762230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_91fddbe23e927e1e525c152baa3" UNIQUE ("code"), CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."hr_role" AS ENUM('HR_MANAGER')`);
        await queryRunner.query(`CREATE TABLE "hr_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" text, "role" "public"."hr_role" NOT NULL DEFAULT 'HR_MANAGER', "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_bc1a3f45d2582643f825625bdba" UNIQUE ("email"), CONSTRAINT "PK_e0c928bb4d3457a5c68a1baa418" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."salary_audit_action" AS ENUM('INITIAL_SALARY', 'SALARY_REVISION', 'SALARY_CORRECTION')`);
        await queryRunner.query(`CREATE TABLE "salary_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employee_id" uuid NOT NULL, "salary_record_id" uuid NOT NULL, "changed_by" uuid NOT NULL, "action" "public"."salary_audit_action" NOT NULL, "old_amount" numeric(18,2), "new_amount" numeric(18,2) NOT NULL, "old_currency_code" character varying(3), "new_currency_code" character varying(3) NOT NULL, "reason" character varying(255), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_677bbd03b806fb68e79fc9e3b84" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_audit_user_created" ON "salary_audit_logs"  ("changed_by", "created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_audit_employee_created" ON "salary_audit_logs"  ("employee_id", "created_at") `);
        await queryRunner.query(`CREATE TABLE "currencies" ("code" character varying(3) NOT NULL, "name" character varying(60) NOT NULL, "symbol" character varying(8), "decimal_places" smallint NOT NULL DEFAULT '2', CONSTRAINT "PK_9f8d0972aeeb5a2277e40332d29" PRIMARY KEY ("code"))`);
        await queryRunner.query(`CREATE TABLE "salary_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employee_id" uuid NOT NULL, "amount" numeric(18,2) NOT NULL, "currency_code" character varying(3) NOT NULL, "effective_from" date NOT NULL, "effective_to" date, "change_reason" character varying(255), "created_by" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_salary_effective_dates" CHECK ("effective_to" IS NULL OR "effective_to" >= "effective_from"), CONSTRAINT "chk_salary_amount_positive" CHECK ("amount" > 0), CONSTRAINT "PK_128bfe492c723d003e91dba8ee7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_salary_employee_start" ON "salary_records"  ("employee_id", "effective_from") `);
        await queryRunner.query(`CREATE INDEX "idx_salary_currency_effective" ON "salary_records"  ("currency_code", "effective_from") `);
        await queryRunner.query(`CREATE INDEX "idx_salary_employee_effective" ON "salary_records"  ("employee_id", "effective_from") `);
        await queryRunner.query(`CREATE TYPE "public"."employment_status" AS ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED')`);
        await queryRunner.query(`CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "employee_code" character varying(30) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "department_id" uuid NOT NULL, "country_id" uuid NOT NULL, "designation" character varying(120) NOT NULL, "joining_date" date NOT NULL, "employment_status" "public"."employment_status" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_56162b5f24af743a154680684f5" UNIQUE ("employee_code"), CONSTRAINT "UQ_765bc1ac8967533a04c74a9f6af" UNIQUE ("email"), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_employees_name" ON "employees"  ("last_name", "first_name") `);
        await queryRunner.query(`CREATE INDEX "idx_employees_country_status" ON "employees"  ("country_id", "employment_status") `);
        await queryRunner.query(`CREATE INDEX "idx_employees_department_status" ON "employees"  ("department_id", "employment_status") `);
        await queryRunner.query(`CREATE TABLE "countries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(2) NOT NULL, "name" character varying(100) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_b47cbb5311bad9c9ae17b8c1eda" UNIQUE ("code"), CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" ADD CONSTRAINT "FK_e6e18979ff091a30189c9b03815" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" ADD CONSTRAINT "FK_ae6e096cc97f64343fb5fd72e46" FOREIGN KEY ("salary_record_id") REFERENCES "salary_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" ADD CONSTRAINT "FK_c2d5b42df2770d641bf88873ab3" FOREIGN KEY ("changed_by") REFERENCES "hr_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" ADD CONSTRAINT "FK_46d81aa901e3b16169c0c484337" FOREIGN KEY ("old_currency_code") REFERENCES "currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" ADD CONSTRAINT "FK_25063ccd62e703fcf761f8ab39f" FOREIGN KEY ("new_currency_code") REFERENCES "currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salary_records" ADD CONSTRAINT "FK_904a4831f413c825f6ff76fc2c4" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salary_records" ADD CONSTRAINT "FK_0ca87974d9ae72d6f52684d46c2" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salary_records" ADD CONSTRAINT "FK_1deb944614e686f91af8a515a88" FOREIGN KEY ("created_by") REFERENCES "hr_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_678a3540f843823784b0fe4a4f2" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_7caec81be4bbf6e1d4d345d1ebd" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_7caec81be4bbf6e1d4d345d1ebd"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_678a3540f843823784b0fe4a4f2"`);
        await queryRunner.query(`ALTER TABLE "salary_records" DROP CONSTRAINT "FK_1deb944614e686f91af8a515a88"`);
        await queryRunner.query(`ALTER TABLE "salary_records" DROP CONSTRAINT "FK_0ca87974d9ae72d6f52684d46c2"`);
        await queryRunner.query(`ALTER TABLE "salary_records" DROP CONSTRAINT "FK_904a4831f413c825f6ff76fc2c4"`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" DROP CONSTRAINT "FK_25063ccd62e703fcf761f8ab39f"`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" DROP CONSTRAINT "FK_46d81aa901e3b16169c0c484337"`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" DROP CONSTRAINT "FK_c2d5b42df2770d641bf88873ab3"`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" DROP CONSTRAINT "FK_ae6e096cc97f64343fb5fd72e46"`);
        await queryRunner.query(`ALTER TABLE "salary_audit_logs" DROP CONSTRAINT "FK_e6e18979ff091a30189c9b03815"`);
        await queryRunner.query(`DROP TABLE "countries"`);
        await queryRunner.query(`DROP INDEX "public"."idx_employees_department_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_employees_country_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_employees_name"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TYPE "public"."employment_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_salary_employee_effective"`);
        await queryRunner.query(`DROP INDEX "public"."idx_salary_currency_effective"`);
        await queryRunner.query(`DROP INDEX "public"."uq_salary_employee_start"`);
        await queryRunner.query(`DROP TABLE "salary_records"`);
        await queryRunner.query(`DROP TABLE "currencies"`);
        await queryRunner.query(`DROP INDEX "public"."idx_audit_employee_created"`);
        await queryRunner.query(`DROP INDEX "public"."idx_audit_user_created"`);
        await queryRunner.query(`DROP TABLE "salary_audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."salary_audit_action"`);
        await queryRunner.query(`DROP TABLE "hr_users"`);
        await queryRunner.query(`DROP TYPE "public"."hr_role"`);
        await queryRunner.query(`DROP TABLE "departments"`);
    }

}
