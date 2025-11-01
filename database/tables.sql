-- golf.round definition

-- Drop table

-- DROP TABLE golf.round;

CREATE TABLE golf.round (
	round_id serial4 NOT NULL,
	start_date date NOT NULL,
	end_date date NOT NULL,
	"name" text NULL,
	CONSTRAINT round_pkey PRIMARY KEY (round_id)
);


-- golf.team definition

-- Drop table

-- DROP TABLE golf.team;

CREATE TABLE golf.team (
	team_id serial4 NOT NULL,
	"name" text NOT NULL,
	logo bytea NULL,
	CONSTRAINT team_pkey PRIMARY KEY (team_id)
);


-- golf.golfer definition

-- Drop table

-- DROP TABLE golf.golfer;

CREATE TABLE golf.golfer (
	golfer_id serial4 NOT NULL,
	team_id int4 NOT NULL,
	"name" text NOT NULL,
	handicap numeric(4, 1) NULL,
	email text NULL,
	CONSTRAINT golfer_email_key UNIQUE (email),
	CONSTRAINT golfer_pkey PRIMARY KEY (golfer_id),
	CONSTRAINT golfer_team_id_fkey FOREIGN KEY (team_id) REFERENCES golf.team(team_id) ON DELETE CASCADE
);


-- golf.score definition

-- Drop table

-- DROP TABLE golf.score;

CREATE TABLE golf.score (
	score_id serial4 NOT NULL,
	golfer_id int4 NOT NULL,
	round_id int4 NOT NULL,
	played_on date NOT NULL,
	strokes int4 NOT NULL,
	CONSTRAINT score_pkey PRIMARY KEY (score_id),
	CONSTRAINT unique_golfer_round_day UNIQUE (golfer_id, round_id, played_on),
	CONSTRAINT score_golfer_id_fkey FOREIGN KEY (golfer_id) REFERENCES golf.golfer(golfer_id) ON DELETE CASCADE,
	CONSTRAINT score_round_id_fkey FOREIGN KEY (round_id) REFERENCES golf.round(round_id) ON DELETE CASCADE
);