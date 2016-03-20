function _precompile_()
    ccall(:jl_generating_output, Cint, ()) == 1 || return nothing
    precompile(Core.Inference.indexed_next, (Tuple{Void, TypeConstructor}, Int32, Int32,))
    precompile(Core.Inference.indexed_next, (Tuple{Void, Union}, Int32, Int32,))
    precompile(Core.Inference.start, (Tuple{Void, Union},))
    precompile(Core.Inference.gensym_increment, (Float64, Int32,))
    precompile(Core.Inference.eltype, (Type{Array{Expr, 1}},))
    precompile(Core.Inference.start, (Tuple{Void, TypeConstructor},))
end
